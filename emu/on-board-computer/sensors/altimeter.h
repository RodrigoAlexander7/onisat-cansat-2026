#ifndef OBC_SENSORS_ALTIMETER_H
#define OBC_SENSORS_ALTIMETER_H

namespace sensors {

class Altimeter {
 public:
  bool init();
  float readPressurePa();
  float getAltitudeMeters(float refPressurePa);
};

}  // namespace sensors

#endif
