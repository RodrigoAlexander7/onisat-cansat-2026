#ifndef OBC_COMMS_PACKET_H
#define OBC_COMMS_PACKET_H

#include <cstddef>
#include <cstdint>
#include <vector>

namespace comms::packet {

constexpr std::size_t kImageHeaderSize = 6;
constexpr std::size_t kImageStartHeaderSize = 8;  // type, imageId, totalFrags, totalBytes(u32), repeatCount
constexpr std::size_t kImageEndHeaderSize = 3;    // type, imageId, totalFrags

std::vector<uint8_t> buildImageFragment(
    uint8_t imageId,
    uint8_t fragmentIndex,
    uint8_t totalFragments,
    const std::vector<uint8_t>& chunk);

std::vector<uint8_t> buildImageStart(
    uint8_t imageId,
    uint8_t totalFragments,
    uint32_t totalBytes,
    uint8_t repeatCount);

std::vector<uint8_t> buildImageEnd(
    uint8_t imageId,
    uint8_t totalFragments);

}  // namespace comms::packet

#endif
