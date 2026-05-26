#ifndef OBC_FSM_STATES_H
#define OBC_FSM_STATES_H

namespace fsm {

enum class MissionState {
  kInit,
  kIdle,
  kAscent,
  kFreeFall,
  kLanding,
  kMissionComplete,
};

}  // namespace fsm

#endif
