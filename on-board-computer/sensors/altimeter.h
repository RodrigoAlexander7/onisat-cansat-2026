#ifndef OBC_SENSORS_ALTIMETER_H
#define OBC_SENSORS_ALTIMETER_H

#include <cstdint>

#include "i2c_bus.h"

namespace sensors {

class Altimeter {
 public:
  explicit Altimeter(I2cBus* bus);
  bool init();
  bool isAvailable() const;
  float readPressurePa();
  float readTemperatureC();
  float getAltitudeMeters(float refPressurePa);

 private:
  bool readAdc(uint8_t command, uint32_t* value);

  I2cBus* bus_;
  uint8_t addr_;
  bool available_;
  uint16_t c_[7];
};

}  // namespace sensors

#endif
