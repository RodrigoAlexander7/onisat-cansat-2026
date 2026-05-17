#ifndef OBC_SENSORS_ENVIRONMENT_H
#define OBC_SENSORS_ENVIRONMENT_H

#include <cstdint>

#include "i2c_bus.h"

namespace sensors {

class Environment {
 public:
  explicit Environment(I2cBus* bus);
  bool init();
  bool isAvailable() const;
  bool read(float* temperatureC, float* humidityPct);

 private:
  I2cBus* bus_;
  uint8_t addr_;
  bool available_;

  uint16_t digT1_;
  int16_t digT2_;
  int16_t digT3_;
  uint8_t digH1_;
  int16_t digH2_;
  uint8_t digH3_;
  int16_t digH4_;
  int16_t digH5_;
  int8_t digH6_;
};

}  // namespace sensors

#endif
