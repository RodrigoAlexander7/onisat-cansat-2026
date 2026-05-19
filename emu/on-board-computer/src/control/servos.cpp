#include "control/servos.h"

#include <algorithm>
#include <chrono>
#include <cstdio>
#include <thread>
#include <unistd.h>

#include <lgpio.h>

#include "config.h"

namespace control {

Servos::~Servos() {
  if (chipHandle_ >= 0) {
    lgGpiochipClose(chipHandle_);
    chipHandle_ = -1;
  }
}

bool Servos::init() {
  if (access("/dev/gpiochip0", F_OK) != 0) {
    available_ = false;
    std::printf("[Servos] GPIO no disponible, se continua sin control de servos\n");
    return false;
  }

  chipHandle_ = lgGpiochipOpen(0);
  if (chipHandle_ < 0) {
    available_ = false;
    std::printf("[Servos] No se pudo abrir gpiochip0 (err=%d)\n", chipHandle_);
    return false;
  }

  int rc = lgGpioClaimOutput(chipHandle_, 0, config::kServo1Gpio, 0);
  if (rc < 0) {
    std::printf("[Servos] No se pudo reclamar GPIO%u para servo1 (err=%d)\n",
                static_cast<unsigned>(config::kServo1Gpio), rc);
    lgGpiochipClose(chipHandle_);
    chipHandle_ = -1;
    available_ = false;
    return false;
  }

  rc = lgGpioClaimOutput(chipHandle_, 0, config::kServo2Gpio, 0);
  if (rc < 0) {
    std::printf("[Servos] No se pudo reclamar GPIO%u para servo2 (err=%d)\n",
                static_cast<unsigned>(config::kServo2Gpio), rc);
    lgGpiochipClose(chipHandle_);
    chipHandle_ = -1;
    available_ = false;
    return false;
  }

  available_ = true;
  std::printf("[Servos] Listos: servo1 GPIO%u, servo2 GPIO%u\n",
              static_cast<unsigned>(config::kServo1Gpio),
              static_cast<unsigned>(config::kServo2Gpio));
  return true;
}

bool Servos::isAvailable() const { return available_; }

bool Servos::setAngle(uint8_t gpio, float angleDeg) {
  if (!available_ || chipHandle_ < 0) {
    return false;
  }

  const float clamped = std::clamp(angleDeg, 0.0f, 180.0f);
  const float pulseUs = config::kServoMinPulseUs +
                        (clamped / 180.0f) * (config::kServoMaxPulseUs - config::kServoMinPulseUs);
  const float dutyCycle = (pulseUs / 20000.0f) * 100.0f;

  const int rc = lgTxPwm(chipHandle_, gpio, config::kServoPwmFrequencyHz, dutyCycle, 0, 0);
  if (rc < 0) {
    std::printf("[Servos] Error PWM GPIO%u (err=%d)\n", static_cast<unsigned>(gpio), rc);
    return false;
  }
  return true;
}

void Servos::stopPwm(uint8_t gpio) {
  if (!available_ || chipHandle_ < 0) {
    return;
  }
  lgTxPwm(chipHandle_, gpio, config::kServoPwmFrequencyHz, 0.0, 0, 0);
}

bool Servos::deploy() {
  if (deployed_) {
    return true;
  }
  if (!available_) {
    deployed_ = true;
    std::printf("[Servos] Despliegue solicitado, pero servos no disponibles\n");
    return false;
  }

  const bool ok1 = setAngle(config::kServo1Gpio, config::kServo1DeployAngleDeg);
  const bool ok2 = setAngle(config::kServo2Gpio, config::kServo2DeployAngleDeg);
  if (!ok1 || !ok2) {
    std::printf("[Servos] Fallo en despliegue PWM\n");
    return false;
  }

  std::this_thread::sleep_for(std::chrono::milliseconds(config::kServoHoldMs));
  stopPwm(config::kServo1Gpio);
  stopPwm(config::kServo2Gpio);
  deployed_ = true;
  std::printf("[Servos] Despliegue ejecutado (servo1=%.1f°, servo2=%.1f°)\n",
              config::kServo1DeployAngleDeg, config::kServo2DeployAngleDeg);
  return true;
}

}  // namespace control
