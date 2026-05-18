#ifndef OBC_FSM_MACHINE_H
#define OBC_FSM_MACHINE_H

#include <array>

#include "comms/lora.h"
#include "control/servos.h"
#include "fsm/states.h"
#include "imaging/camera.h"
#include "imaging/queue.h"
#include "sensors/altimeter.h"
#include "sensors/environment.h"
#include "sensors/imu.h"
#include "sensors/magnetometer.h"
#include "sensors/power.h"

namespace fsm {

class Machine {
 public:
  struct Dependencies {
    comms::LoRaTransceiver* lora = nullptr;
    imaging::Camera* camera = nullptr;
    imaging::ImageQueue* queue = nullptr;
    control::Servos* servos = nullptr;
    sensors::Altimeter* altimeter = nullptr;
    sensors::Environment* environment = nullptr;
    sensors::Imu* imu = nullptr;
    sensors::Magnetometer* magnetometer = nullptr;
    sensors::Power* power = nullptr;
  };

  explicit Machine(const Dependencies& deps);
  bool init();
  MissionState state() const;
  bool tick();

  private:
  bool sendTelemetry();
  bool sendOneImageFragment();
  void readSensors();
  void updateIdleState();
  void updateAscentState();
  void updateFreeFallState();
  void updateLandingState();
  void transitionTo(MissionState nextState);
  uint32_t nowMs() const;

  Dependencies deps_;
  MissionState state_ = MissionState::kInit;
  float refPressurePa_ = 101325.0f;
  std::array<float, 32> pressureWindow_{};
  size_t pressureWindowSize_ = 0;
  size_t pressureWindowIndex_ = 0;
  int ascentConfirmCount_ = 0;
  int freeFallAccelCount_ = 0;
  int landingStableCount_ = 0;
  bool impactDetected_ = false;
  bool servosDeployed_ = false;
  uint32_t landingStartMs_ = 0;
  uint16_t telemetrySequence_ = 0;
  uint32_t lastTelemetryMs_ = 0;
  int fragmentsSinceTelemetry_ = 0;
  int nextMilestoneIndex_ = 0;
  bool cameraAvailable_ = false;

  float altitudeM_ = 0.0f;
  float pressurePa_ = 0.0f;
  float tempC_ = 0.0f;
  float humPct_ = 0.0f;
  float ax_ = 0.0f;
  float ay_ = 0.0f;
  float az_ = 0.0f;
  float gx_ = 0.0f;
  float gy_ = 0.0f;
  float gz_ = 0.0f;
  float mx_ = 0.0f;
  float my_ = 0.0f;
  float mz_ = 0.0f;
  float currentA_ = 0.0f;
  float powerW_ = 0.0f;
};

}  // namespace fsm

#endif
