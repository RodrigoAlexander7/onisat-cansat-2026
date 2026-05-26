#ifndef OBC_SENSORS_MAGNETOMETER_H
#define OBC_SENSORS_MAGNETOMETER_H

#include "i2c_bus.h"

namespace sensors {

class Magnetometer {
 public:
  explicit Magnetometer(I2cBus* bus);
  bool init();
  bool isAvailable() const;
  bool read(float* mx, float* my, float* mz);

 private:
  I2cBus* bus_;
  uint8_t addr_;
  bool available_;
};

}  // namespace sensors

#endif
