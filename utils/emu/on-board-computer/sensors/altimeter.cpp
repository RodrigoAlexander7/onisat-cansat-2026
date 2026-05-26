#include "altimeter.h"

#include <cmath>
#include <cstdio>
#include <unistd.h>

namespace sensors {

namespace {
constexpr uint8_t kCandidates[] = {0x77, 0x76};
}

Altimeter::Altimeter(I2cBus* bus) : bus_(bus), addr_(0), available_(false), c_{0} {}

bool Altimeter::init() {
  available_ = false;
  for (uint8_t addr : kCandidates) {
    bool ok = bus_->writeCommand(addr, 0x1E);  // reset
    if (!ok) {
      continue;
    }
    usleep(3000);

    bool promOk = true;
    for (int i = 0; i < 8; ++i) {
      uint8_t data[2] = {0};
      if (!bus_->readBytes(addr, static_cast<uint8_t>(0xA0 + i * 2), data, 2)) {
        promOk = false;
        break;
      }
      c_[i] = static_cast<uint16_t>((data[0] << 8) | data[1]);
      if (i >= 1 && i <= 6 && (c_[i] == 0 || c_[i] == 0xFFFF)) {
        promOk = false;
      }
    }
    if (promOk) {
      addr_ = addr;
      available_ = true;
      std::printf("[MS5611] OK @0x%02X\n", addr_);
      return true;
    }
  }
  std::printf("[MS5611] No detectado\n");
  return false;
}

bool Altimeter::isAvailable() const {
  return available_;
}

bool Altimeter::readAdc(uint8_t command, uint32_t* value) {
  if (!available_) {
    return false;
  }
  if (!bus_->writeCommand(addr_, command)) {
    return false;
  }
  usleep(10000);
  uint8_t raw[3] = {0};
  if (!bus_->readBytes(addr_, 0x00, raw, 3)) {
    return false;
  }
  *value = (static_cast<uint32_t>(raw[0]) << 16) |
           (static_cast<uint32_t>(raw[1]) << 8) |
           static_cast<uint32_t>(raw[2]);
  return true;
}

float Altimeter::readPressurePa() {
  if (!available_) {
    return NAN;
  }
  uint32_t d1 = 0;
  uint32_t d2 = 0;
  if (!readAdc(0x48, &d1) || !readAdc(0x50, &d2)) {
    return NAN;
  }

  const double d_t = static_cast<double>(d2) - static_cast<double>(c_[5]) * 256.0;
  const double off = static_cast<double>(c_[2]) * 65536.0 + (static_cast<double>(c_[4]) * d_t) / 128.0;
  const double sens = static_cast<double>(c_[1]) * 32768.0 + (static_cast<double>(c_[3]) * d_t) / 256.0;
  const double pressure_hpa = (static_cast<double>(d1) * sens / 2097152.0 - off) / 32768.0;
  return static_cast<float>(pressure_hpa * 100.0);  // Pa
}

float Altimeter::readTemperatureC() {
  if (!available_) {
    return NAN;
  }
  uint32_t d2 = 0;
  if (!readAdc(0x50, &d2)) {
    return NAN;
  }
  const double d_t = static_cast<double>(d2) - static_cast<double>(c_[5]) * 256.0;
  const double temp = 2000.0 + d_t * static_cast<double>(c_[6]) / 8388608.0;
  return static_cast<float>(temp / 100.0);
}

float Altimeter::getAltitudeMeters(float refPressurePa) {
  const float pressure = readPressurePa();
  if (!std::isfinite(pressure) || refPressurePa <= 0.0f) {
    return NAN;
  }
  return 44330.0f * (1.0f - std::pow(pressure / refPressurePa, 0.19029495f));
}

}  // namespace sensors
