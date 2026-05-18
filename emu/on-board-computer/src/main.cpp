#include <cstdio>

#include "comms/lora.h"
#include "control/servos.h"
#include "fsm/machine.h"
#include "imaging/camera.h"
#include "imaging/queue.h"
#include "sensors/altimeter.h"
#include "sensors/environment.h"
#include "sensors/i2c_bus.h"
#include "sensors/imu.h"
#include "sensors/magnetometer.h"
#include "sensors/power.h"

int main() {
  comms::LoRaTransceiver lora;
  imaging::Camera camera;
  imaging::ImageQueue queue;
  control::Servos servos;

  sensors::I2cBus bus("/dev/i2c-1");
  sensors::Altimeter altimeter(&bus);
  sensors::Environment environment(&bus);
  sensors::Imu imu(&bus);
  sensors::Magnetometer magnetometer(&bus);
  sensors::Power power(&bus);

  if (!lora.init()) {
    std::printf("[Main] LoRa no disponible, no es posible iniciar la mision\n");
    return 1;
  }

  if (!bus.open()) {
    std::printf("[Main] Bus I2C no disponible, se continua con sensores en cero\n");
  }

  fsm::Machine::Dependencies deps{
      .lora = &lora,
      .camera = &camera,
      .queue = &queue,
      .servos = &servos,
      .altimeter = &altimeter,
      .environment = &environment,
      .imu = &imu,
      .magnetometer = &magnetometer,
      .power = &power,
  };

  fsm::Machine machine(deps);
  machine.init();

  std::printf("[Main] Mision iniciada\n");
  while (machine.tick()) {
  }
  std::printf("[Main] Mision finalizada\n");
  return 0;
}
