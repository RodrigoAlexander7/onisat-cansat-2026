#include "comms/packet.h"

#include "config.h"

namespace comms::packet {

std::vector<uint8_t> buildImageFragment(
    uint8_t imageId,
    uint8_t fragmentIndex,
    uint8_t totalFragments,
    const std::vector<uint8_t>& chunk) {
  std::vector<uint8_t> packet;
  packet.reserve(kImageHeaderSize + chunk.size());

  packet.push_back(config::kImagePacketType);
  packet.push_back(imageId);
  packet.push_back(fragmentIndex);
  packet.push_back(totalFragments);
  packet.push_back(static_cast<uint8_t>((chunk.size() >> 8) & 0xFF));
  packet.push_back(static_cast<uint8_t>(chunk.size() & 0xFF));
  packet.insert(packet.end(), chunk.begin(), chunk.end());

  return packet;
}

}  // namespace comms::packet
