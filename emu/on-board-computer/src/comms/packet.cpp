#include "comms/packet.h"

#include <algorithm>
#include <cmath>

#include "config.h"

namespace comms::packet {

namespace {

void pushU16(std::vector<uint8_t>* packet, uint16_t value) {
  packet->push_back(static_cast<uint8_t>((value >> 8) & 0xFF));
  packet->push_back(static_cast<uint8_t>(value & 0xFF));
}

void pushU32(std::vector<uint8_t>* packet, uint32_t value) {
  packet->push_back(static_cast<uint8_t>((value >> 24) & 0xFF));
  packet->push_back(static_cast<uint8_t>((value >> 16) & 0xFF));
  packet->push_back(static_cast<uint8_t>((value >> 8) & 0xFF));
  packet->push_back(static_cast<uint8_t>(value & 0xFF));
}

void pushI16(std::vector<uint8_t>* packet, int16_t value) {
  pushU16(packet, static_cast<uint16_t>(value));
}

void pushI32(std::vector<uint8_t>* packet, int32_t value) {
  pushU32(packet, static_cast<uint32_t>(value));
}

int16_t clampToI16(float value) {
  if (!std::isfinite(value)) {
    return 0;
  }
  int v = static_cast<int>(std::lround(value));
  v = std::clamp(v, -32768, 32767);
  return static_cast<int16_t>(v);
}

uint16_t clampToU16(float value) {
  if (!std::isfinite(value)) {
    return 0;
  }
  int v = static_cast<int>(std::lround(value));
  v = std::clamp(v, 0, 65535);
  return static_cast<uint16_t>(v);
}

uint8_t clampToU8(float value) {
  if (!std::isfinite(value)) {
    return 0;
  }
  int v = static_cast<int>(std::lround(value));
  v = std::clamp(v, 0, 255);
  return static_cast<uint8_t>(v);
}

}  // namespace

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

std::vector<uint8_t> buildImageStart(
    uint8_t imageId,
    uint8_t totalFragments,
    uint32_t totalBytes,
    uint8_t repeatCount) {
  std::vector<uint8_t> packet;
  packet.reserve(kImageStartHeaderSize);

  packet.push_back(config::kImageStartPacketType);
  packet.push_back(imageId);
  packet.push_back(totalFragments);
  packet.push_back(static_cast<uint8_t>((totalBytes >> 24) & 0xFF));
  packet.push_back(static_cast<uint8_t>((totalBytes >> 16) & 0xFF));
  packet.push_back(static_cast<uint8_t>((totalBytes >> 8) & 0xFF));
  packet.push_back(static_cast<uint8_t>(totalBytes & 0xFF));
  packet.push_back(repeatCount);

  return packet;
}

std::vector<uint8_t> buildImageEnd(
    uint8_t imageId,
    uint8_t totalFragments) {
  std::vector<uint8_t> packet;
  packet.reserve(kImageEndHeaderSize);

  packet.push_back(config::kImageEndPacketType);
  packet.push_back(imageId);
  packet.push_back(totalFragments);

  return packet;
}

std::vector<uint8_t> buildTelemetry(const TelemetryData& data) {
  std::vector<uint8_t> packet;
  packet.reserve(config::kMaxLoraPayloadBytes);

  packet.push_back(config::kTelemetryPacketType);
  pushU32(&packet, data.timestampMs);
  packet.push_back(data.missionState);
  pushU16(&packet, data.sequence);

  const float pressure10 = std::isfinite(data.pressurePa) ? data.pressurePa * 10.0f : 0.0f;
  pushI32(&packet, static_cast<int32_t>(std::lround(pressure10)));
  pushI16(&packet, clampToI16(data.altitudeM * 10.0f));
  pushI16(&packet, clampToI16(data.tempC * 10.0f));
  packet.push_back(clampToU8(data.humPct));

  pushI16(&packet, clampToI16(data.ax * 1000.0f));
  pushI16(&packet, clampToI16(data.ay * 1000.0f));
  pushI16(&packet, clampToI16(data.az * 1000.0f));
  pushI16(&packet, clampToI16(data.gx * 1000.0f));
  pushI16(&packet, clampToI16(data.gy * 1000.0f));
  pushI16(&packet, clampToI16(data.gz * 1000.0f));

  pushI16(&packet, clampToI16(data.mx * 10.0f));
  pushI16(&packet, clampToI16(data.my * 10.0f));
  pushI16(&packet, clampToI16(data.mz * 10.0f));

  pushU16(&packet, clampToU16(data.currentA * 100.0f));
  pushU16(&packet, clampToU16(data.powerW * 100.0f));
  return packet;
}

}  // namespace comms::packet
