#ifndef OBC_COMMS_LORA_H
#define OBC_COMMS_LORA_H

#include <cstdint>
#include <vector>

class PiHal;
class Module;
class SX1278;

namespace comms {

class LoRaTransceiver {
 public:
  LoRaTransceiver();
  ~LoRaTransceiver();

  bool init();
  bool sendPacket(const std::vector<uint8_t>& payload);
  void delayMs(unsigned long ms) const;

 private:
  PiHal* hal_;
  Module* module_;
  SX1278* radio_;
  bool initialized_;
};

}  // namespace comms

#endif
