#ifndef OBC_CONTROL_SERVOS_H
#define OBC_CONTROL_SERVOS_H

namespace control {

class Servos {
 public:
  bool init();
  bool isAvailable() const;
  void deploy();

 private:
  bool available_ = false;
  bool deployed_ = false;
};

}  // namespace control

#endif
