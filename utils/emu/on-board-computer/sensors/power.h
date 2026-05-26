#ifndef OBC_SENSORS_POWER_H
#define OBC_SENSORS_POWER_H

#include "i2c_bus.h"

namespace sensors {

class Power {
 public:
  explicit Power(I2cBus* bus);
  bool init();
  bool isAvailable() const;
  bool read(float* currentA, float* powerW);

 private:
  bool readRegister16(uint8_t reg, uint16_t* value);

  I2cBus* bus_;
  uint8_t addr_;
  bool available_;
  float shuntOhm_;
};

}  // namespace sensors

#endif
