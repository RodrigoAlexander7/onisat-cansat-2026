#include "fsm/machine.h"

namespace fsm {

MissionState Machine::state() const {
  return state_;
}

void Machine::tick() {}

}  // namespace fsm
