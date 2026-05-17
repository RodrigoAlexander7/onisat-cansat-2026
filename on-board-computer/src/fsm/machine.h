#ifndef OBC_FSM_MACHINE_H
#define OBC_FSM_MACHINE_H

#include "fsm/states.h"

namespace fsm {

class Machine {
 public:
  MissionState state() const;
  void tick();

 private:
  MissionState state_ = MissionState::kInit;
};

}  // namespace fsm

#endif
