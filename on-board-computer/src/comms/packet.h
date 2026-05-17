#ifndef OBC_COMMS_PACKET_H
#define OBC_COMMS_PACKET_H

#include <cstddef>
#include <cstdint>
#include <vector>

namespace comms::packet {

constexpr std::size_t kImageHeaderSize = 6;

std::vector<uint8_t> buildImageFragment(
    uint8_t imageId,
    uint8_t fragmentIndex,
    uint8_t totalFragments,
    const std::vector<uint8_t>& chunk);

}  // namespace comms::packet

#endif
