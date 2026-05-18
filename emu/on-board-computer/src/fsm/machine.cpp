#include "fsm/machine.h"

#include <chrono>
#include <cmath>
#include <cstdio>
#include <iterator>
#include <vector>

#include "comms/packet.h"
#include "config.h"

namespace fsm {

namespace {
constexpr float kPhotoMilestonesMeters[] = {10.0f, 30.0f, 50.0f, 100.0f, 200.0f};

uint8_t missionStateToByte(MissionState state) {
  return static_cast<uint8_t>(state);
}

}  // namespace

Machine::Machine(const Dependencies& deps) : deps_(deps) {}

bool Machine::init() {
  std::printf("[FSM] Inicializando componentes...\n");

  cameraAvailable_ = deps_.camera && deps_.camera->init();
  if (!cameraAvailable_) {
    std::printf("[FSM] Camara no disponible, se continua sin imagenes\n");
  }

  if (!deps_.servos || !deps_.servos->init()) {
    std::printf("[FSM] Servos no disponibles, se continua sin despliegue real\n");
  }

  if (!deps_.altimeter || !deps_.altimeter->init()) {
    std::printf("[FSM] MS5611 no disponible, se usara altitud 0 por defecto\n");
  }
  if (!deps_.environment || !deps_.environment->init()) {
    std::printf("[FSM] BME280 no disponible\n");
  }
  if (!deps_.imu || !deps_.imu->init()) {
    std::printf("[FSM] BMI160 no disponible\n");
  }
  if (!deps_.magnetometer || !deps_.magnetometer->init()) {
    std::printf("[FSM] MMC56x3 no disponible\n");
  }
  if (!deps_.power || !deps_.power->init()) {
    std::printf("[FSM] INA226 no disponible\n");
  }

  float sumPressure = 0.0f;
  int validCount = 0;
  for (int i = 0; i < static_cast<int>(pressureWindow_.size()); ++i) {
    const float p = deps_.altimeter ? deps_.altimeter->readPressurePa() : NAN;
    if (std::isfinite(p) && p > 1000.0f) {
      sumPressure += p;
      pressureWindow_[pressureWindowSize_++] = p;
      validCount++;
    }
    deps_.lora->delayMs(20);
  }
  if (validCount > 0) {
    refPressurePa_ = sumPressure / static_cast<float>(validCount);
  }

  std::printf("[FSM] Presion base inicial: %.2f Pa\n", refPressurePa_);
  lastTelemetryMs_ = nowMs();
  transitionTo(MissionState::kIdle);
  return true;
}

MissionState Machine::state() const { return state_; }

uint32_t Machine::nowMs() const {
  const auto now = std::chrono::steady_clock::now().time_since_epoch();
  return static_cast<uint32_t>(
      std::chrono::duration_cast<std::chrono::milliseconds>(now).count() & 0xFFFFFFFFu);
}

void Machine::transitionTo(MissionState nextState) {
  if (state_ == nextState) {
    return;
  }
  state_ = nextState;
  std::printf("[FSM] Estado -> %d\n", static_cast<int>(state_));

  if (state_ == MissionState::kFreeFall) {
    if (deps_.queue) {
      deps_.queue->clear();
    }
  }
  if (state_ == MissionState::kLanding) {
    landingStartMs_ = nowMs();
  }
}

void Machine::readSensors() {
  pressurePa_ = deps_.altimeter ? deps_.altimeter->readPressurePa() : NAN;
  altitudeM_ = std::isfinite(pressurePa_) && refPressurePa_ > 0.0f
                   ? 44330.0f * (1.0f - std::pow(pressurePa_ / refPressurePa_, 0.19029495f))
                   : 0.0f;

  if (deps_.environment) {
    deps_.environment->read(&tempC_, &humPct_);
  }
  if (deps_.imu) {
    deps_.imu->read(&ax_, &ay_, &az_, &gx_, &gy_, &gz_);
  }
  if (deps_.magnetometer) {
    deps_.magnetometer->read(&mx_, &my_, &mz_);
  }
  if (deps_.power) {
    deps_.power->read(&currentA_, &powerW_);
  }
}

bool Machine::sendTelemetry() {
  comms::packet::TelemetryData sample;
  sample.timestampMs = nowMs();
  sample.missionState = missionStateToByte(state_);
  sample.sequence = telemetrySequence_;
  sample.pressurePa = pressurePa_;
  sample.altitudeM = altitudeM_;
  sample.tempC = tempC_;
  sample.humPct = humPct_;
  sample.ax = ax_;
  sample.ay = ay_;
  sample.az = az_;
  sample.gx = gx_;
  sample.gy = gy_;
  sample.gz = gz_;
  sample.mx = mx_;
  sample.my = my_;
  sample.mz = mz_;
  sample.currentA = currentA_;
  sample.powerW = powerW_;

  const bool ok = deps_.lora->sendPacket(comms::packet::buildTelemetry(sample));
  if (ok) {
    telemetrySequence_++;
  }
  return ok;
}

bool Machine::sendOneImageFragment() {
  if (!deps_.queue || !deps_.queue->hasPending()) {
    return true;
  }
  auto fragment = deps_.queue->popFragment();
  if (!fragment.has_value()) {
    return true;
  }
  if (!deps_.lora->sendPacket(fragment.value())) {
    return false;
  }
  fragmentsSinceTelemetry_++;
  deps_.lora->delayMs(config::kInterPacketDelayMs);
  return true;
}

void Machine::updateIdleState() {
  if (std::isfinite(pressurePa_) && pressurePa_ > 1000.0f) {
    if (pressureWindowSize_ < pressureWindow_.size()) {
      pressureWindow_[pressureWindowSize_++] = pressurePa_;
    } else {
      pressureWindow_[pressureWindowIndex_] = pressurePa_;
      pressureWindowIndex_ = (pressureWindowIndex_ + 1) % pressureWindow_.size();
    }
    float sum = 0.0f;
    for (size_t i = 0; i < pressureWindowSize_; ++i) {
      sum += pressureWindow_[i];
    }
    if (pressureWindowSize_ > 0) {
      refPressurePa_ = sum / static_cast<float>(pressureWindowSize_);
    }
  }

  if (altitudeM_ > config::kAscentDetectMeters) {
    ascentConfirmCount_++;
  } else {
    ascentConfirmCount_ = 0;
  }
  if (ascentConfirmCount_ >= config::kAscentConfirmSamples) {
    transitionTo(MissionState::kAscent);
  }
}

void Machine::updateAscentState() {
  while (nextMilestoneIndex_ < static_cast<int>(std::size(kPhotoMilestonesMeters)) &&
         altitudeM_ >= kPhotoMilestonesMeters[nextMilestoneIndex_]) {
    if (cameraAvailable_ && deps_.camera && deps_.queue) {
      auto img = deps_.camera->capture();
      if (img.has_value()) {
        deps_.queue->enqueueImage(img.value());
      } else {
        std::printf("[FSM] Captura fallida en hito %.1f m\n", kPhotoMilestonesMeters[nextMilestoneIndex_]);
      }
    }
    nextMilestoneIndex_++;
  }

  const float accNorm = std::sqrt(ax_ * ax_ + ay_ * ay_ + az_ * az_);
  if (accNorm < config::kFreeFallAccelThresholdMs2) {
    freeFallAccelCount_++;
  } else {
    freeFallAccelCount_ = 0;
  }

  if (altitudeM_ >= config::kFreeFallDetectMeters ||
      freeFallAccelCount_ >= config::kFreeFallAccelSamples) {
    transitionTo(MissionState::kFreeFall);
  }
}

void Machine::updateFreeFallState() {
  if (!servosDeployed_ && altitudeM_ <= config::kServoDeployAltitudeMeters) {
    if (deps_.servos) {
      deps_.servos->deploy();
    }
    servosDeployed_ = true;
  }

  const float accNorm = std::sqrt(ax_ * ax_ + ay_ * ay_ + az_ * az_);
  if (accNorm > config::kImpactAccelThresholdMs2) {
    impactDetected_ = true;
  }

  if (std::fabs(altitudeM_) <= config::kLandingAltToleranceMeters) {
    landingStableCount_++;
  } else {
    landingStableCount_ = 0;
  }

  if (impactDetected_ && landingStableCount_ >= config::kLandingStableSamples) {
    transitionTo(MissionState::kLanding);
  }
}

void Machine::updateLandingState() {
  if ((nowMs() - landingStartMs_) >= config::kLandingTelemetryDurationMs) {
    transitionTo(MissionState::kMissionComplete);
  }
}

bool Machine::tick() {
  if (state_ == MissionState::kMissionComplete) {
    return false;
  }

  readSensors();

  switch (state_) {
    case MissionState::kIdle:
      updateIdleState();
      break;
    case MissionState::kAscent:
      updateAscentState();
      break;
    case MissionState::kFreeFall:
      updateFreeFallState();
      break;
    case MissionState::kLanding:
      updateLandingState();
      break;
    case MissionState::kInit:
    case MissionState::kMissionComplete:
      break;
  }

  const uint32_t currentMs = nowMs();

  if (state_ != MissionState::kFreeFall && state_ != MissionState::kLanding) {
    if (!sendOneImageFragment()) {
      return false;
    }
  }

  const bool telemetryDueByRatio = fragmentsSinceTelemetry_ >= config::kImageFragmentsPerTelemetry;
  const bool telemetryDueByTime = (currentMs - lastTelemetryMs_) >= config::kTelemetryPeriodMs;

  if (telemetryDueByRatio || telemetryDueByTime ||
      state_ == MissionState::kFreeFall || state_ == MissionState::kLanding) {
    if (telemetryDueByTime || telemetryDueByRatio) {
      if (!sendTelemetry()) {
        return false;
      }
      lastTelemetryMs_ = currentMs;
      fragmentsSinceTelemetry_ = 0;
    }
  }

  deps_.lora->delayMs(20);
  return state_ != MissionState::kMissionComplete;
}

}  // namespace fsm
