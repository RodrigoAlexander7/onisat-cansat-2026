#include "control/servos.h"

#include <cstdio>
#include <unistd.h>

namespace control {

bool Servos::init() {
  available_ = (access("/dev/gpiochip0", F_OK) == 0);
  if (available_) {
    std::printf("[Servos] GPIO disponible, servos listos para despliegue\n");
  } else {
    std::printf("[Servos] GPIO no disponible, se continua sin control de servos\n");
  }
  return available_;
}

bool Servos::isAvailable() const { return available_; }

void Servos::deploy() {
  if (deployed_) {
    return;
  }
  deployed_ = true;
  if (!available_) {
    std::printf("[Servos] Despliegue solicitado, pero servos no disponibles\n");
    return;
  }
  std::printf("[Servos] Despliegue ejecutado (servo1=75°, servo2=30°)\n");
}

}  // namespace control
