#ifndef OBC_COMMS_PACKET_H
#define OBC_COMMS_PACKET_H

#include <cstddef>
#include <cstdint>
#include <vector>

namespace comms::packet {

constexpr std::size_t kImageHeaderSize = 6;
constexpr std::size_t kImageStartHeaderSize = 8;  // type, imageId, totalFrags, totalBytes(u32), repeatCount
constexpr std::size_t kImageEndHeaderSize = 3;    // type, imageId, totalFrags

struct TelemetryData {
  uint32_t timestampMs = 0;
  uint8_t missionState = 0;
  uint16_t sequence = 0;
  float pressurePa = 0.0f;
  float altitudeM = 0.0f;
  float tempC = 0.0f;
  float humPct = 0.0f;
  float ax = 0.0f;
  float ay = 0.0f;
  float az = 0.0f;
  float gx = 0.0f;
  float gy = 0.0f;
  float gz = 0.0f;
  float mx = 0.0f;
  float my = 0.0f;
  float mz = 0.0f;
  float currentA = 0.0f;
  float powerW = 0.0f;
};

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

std::vector<uint8_t> buildTelemetry(const TelemetryData& data);

}  // namespace comms::packet

#endif
