#ifndef OBC_CONTROL_SERVOS_H
#define OBC_CONTROL_SERVOS_H

#include <cstdint>

namespace control {

class Servos {
 public:
  ~Servos();
  bool init();
  bool isAvailable() const;
  bool deploy();

 private:
  bool setAngle(uint8_t gpio, float angleDeg);
  void stopPwm(uint8_t gpio);

  bool available_ = false;
  bool deployed_ = false;
  int chipHandle_ = -1;
};

}  // namespace control

#endif
