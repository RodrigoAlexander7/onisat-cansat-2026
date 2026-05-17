#include "altimeter.h"

#include <cmath>

namespace sensors {

bool Altimeter::init() {
  return true;
}

float Altimeter::readPressurePa() {
  return 101325.0f;
}

float Altimeter::getAltitudeMeters(float refPressurePa) {
  const float pressure = readPressurePa();
  if (refPressurePa <= 0.0f) {
    return 0.0f;
  }
  return 44330.0f * (1.0f - std::pow(pressure / refPressurePa, 0.19029495f));
}

}  // namespace sensors
