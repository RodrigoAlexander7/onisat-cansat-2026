#include <cstdio>
#include <chrono>
#include <cmath>

#include "comms/lora.h"
#include "comms/packet.h"
#include "config.h"
#include "imaging/camera.h"
#include "imaging/queue.h"
#include "sensors/altimeter.h"
#include "sensors/environment.h"
#include "sensors/i2c_bus.h"
#include "sensors/imu.h"
#include "sensors/magnetometer.h"
#include "sensors/power.h"

namespace {

uint32_t nowMs() {
  const auto now = std::chrono::steady_clock::now().time_since_epoch();
  return static_cast<uint32_t>(
      std::chrono::duration_cast<std::chrono::milliseconds>(now).count() & 0xFFFFFFFFu);
}

comms::packet::TelemetryData readTelemetry(
    uint16_t sequence,
    float refPressurePa,
    sensors::Altimeter* altimeter,
    sensors::Environment* environment,
    sensors::Imu* imu,
    sensors::Magnetometer* magnetometer,
    sensors::Power* power) {
  comms::packet::TelemetryData out;
  out.timestampMs = nowMs();
  out.sequence = sequence;

  out.pressurePa = altimeter->readPressurePa();
  out.altitudeM = std::isfinite(out.pressurePa) && refPressurePa > 0.0f
                      ? 44330.0f * (1.0f - std::pow(out.pressurePa / refPressurePa, 0.19029495f))
                      : 0.0f;

  environment->read(&out.tempC, &out.humPct);
  imu->read(&out.ax, &out.ay, &out.az, &out.gx, &out.gy, &out.gz);
  magnetometer->read(&out.mx, &out.my, &out.mz);
  power->read(&out.currentA, &out.powerW);
  return out;
}

bool sendTelemetry(
    comms::LoRaTransceiver* lora,
    uint16_t* telemetrySequence,
    float refPressurePa,
    sensors::Altimeter* altimeter,
    sensors::Environment* environment,
    sensors::Imu* imu,
    sensors::Magnetometer* magnetometer,
    sensors::Power* power) {
  comms::packet::TelemetryData sample = readTelemetry(
      *telemetrySequence, refPressurePa, altimeter, environment, imu, magnetometer, power);
  std::vector<uint8_t> packet = comms::packet::buildTelemetry(sample);
  const bool ok = lora->sendPacket(packet);
  if (ok) {
    (*telemetrySequence)++;
  }
  return ok;
}

}  // namespace

int main() {
  comms::LoRaTransceiver lora;
  imaging::Camera camera;
  imaging::ImageQueue queue;
  sensors::I2cBus bus("/dev/i2c-1");
  sensors::Altimeter altimeter(&bus);
  sensors::Environment environment(&bus);
  sensors::Imu imu(&bus);
  sensors::Magnetometer magnetometer(&bus);
  sensors::Power power(&bus);

  if (!camera.init()) {
    return 1;
  }
  if (!lora.init()) {
    return 1;
  }
  bus.open();
  altimeter.init();
  environment.init();
  imu.init();
  magnetometer.init();
  power.init();

  std::printf("[Main] Inicio etapa 2: sensores + imagen 3D anaglifo + LoRa\n");

  float refPressurePa = 0.0f;
  int refCount = 0;
  for (int i = 0; i < 20; ++i) {
    const float p = altimeter.readPressurePa();
    if (std::isfinite(p) && p > 1000.0f) {
      refPressurePa += p;
      refCount++;
    }
    lora.delayMs(20);
  }
  if (refCount > 0) {
    refPressurePa /= static_cast<float>(refCount);
  } else {
    refPressurePa = 101325.0f;
  }
  std::printf("[Main] Presion base: %.2f Pa\n", refPressurePa);

  uint16_t telemetrySequence = 0;
  uint32_t lastTelemetryMs = nowMs();

  for (int photoIndex = 0; photoIndex < config::kCaptureCount; ++photoIndex) {
    auto jpegBytes = camera.capture();
    if (!jpegBytes.has_value()) {
      std::printf("[Main] Foto %d fallida, continuando\n", photoIndex);
      continue;
    }

    if (!queue.enqueueImage(jpegBytes.value())) {
      std::printf("[Main] Foto %d no encolada\n", photoIndex);
      continue;
    }

    int fragmentsSinceTelemetry = 0;
    while (queue.hasPending()) {
      auto fragment = queue.popFragment();
      if (!fragment.has_value()) {
        break;
      }

      if (!lora.sendPacket(fragment.value())) {
        std::printf("[Main] Error de envio, deteniendo corrida\n");
        return 1;
      }
      fragmentsSinceTelemetry++;

      const uint32_t currentMs = nowMs();
      if (fragmentsSinceTelemetry >= config::kImageFragmentsPerTelemetry ||
          (currentMs - lastTelemetryMs) >= config::kTelemetryPeriodMs) {
        if (!sendTelemetry(&lora, &telemetrySequence, refPressurePa, &altimeter, &environment, &imu, &magnetometer, &power)) {
          std::printf("[Main] Error enviando telemetria, deteniendo corrida\n");
          return 1;
        }
        lastTelemetryMs = currentMs;
        fragmentsSinceTelemetry = 0;
      }

      lora.delayMs(config::kInterPacketDelayMs);
    }

    if (photoIndex + 1 < config::kCaptureCount) {
      const uint32_t waitStart = nowMs();
      while ((nowMs() - waitStart) < config::kCaptureIntervalMs) {
        const uint32_t currentMs = nowMs();
        if ((currentMs - lastTelemetryMs) >= config::kTelemetryPeriodMs) {
          if (!sendTelemetry(&lora, &telemetrySequence, refPressurePa, &altimeter, &environment, &imu, &magnetometer, &power)) {
            std::printf("[Main] Error enviando telemetria, deteniendo corrida\n");
            return 1;
          }
          lastTelemetryMs = currentMs;
        }
        lora.delayMs(20);
      }
    }
  }

  std::printf("[Main] Etapa 2 finalizada\n");
  return 0;
}
