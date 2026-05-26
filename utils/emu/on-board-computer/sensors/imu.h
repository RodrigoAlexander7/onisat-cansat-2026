#ifndef OBC_SENSORS_IMU_H
#define OBC_SENSORS_IMU_H

#include "i2c_bus.h"

namespace sensors {

class Imu {
 public:
  explicit Imu(I2cBus* bus);
  bool init();
  bool isAvailable() const;
  bool read(float* ax, float* ay, float* az, float* gx, float* gy, float* gz);

 private:
  I2cBus* bus_;
  uint8_t addr_;
  bool available_;
};

}  // namespace sensors

#endif
