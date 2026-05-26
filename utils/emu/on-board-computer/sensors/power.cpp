#include "power.h"

#include <cstdio>

namespace sensors {

namespace {
constexpr uint8_t kCandidates[] = {0x40, 0x41, 0x44, 0x45};
}

Power::Power(I2cBus* bus) : bus_(bus), addr_(0), available_(false), shuntOhm_(0.1f) {}

bool Power::readRegister16(uint8_t reg, uint16_t* value) {
  uint8_t raw[2] = {0};
  if (!bus_->readBytes(addr_, reg, raw, 2)) {
    return false;
  }
  *value = static_cast<uint16_t>((raw[0] << 8) | raw[1]);
  return true;
}

bool Power::init() {
  available_ = false;
  for (uint8_t addr : kCandidates) {
    addr_ = addr;
    uint16_t busV = 0;
    uint16_t shuntV = 0;
    if (!readRegister16(0x02, &busV) || !readRegister16(0x01, &shuntV)) {
      continue;
    }

    available_ = true;
    std::printf("[INA226] OK @0x%02X\n", addr_);
    return true;
  }
  std::printf("[INA226] No detectado\n");
  return false;
}

bool Power::isAvailable() const { return available_; }

bool Power::read(float* currentA, float* powerW) {
  if (!available_) {
    return false;
  }
  uint16_t rawV = 0;
  uint16_t rawS = 0;
  if (!readRegister16(0x02, &rawV) || !readRegister16(0x01, &rawS)) {
    return false;
  }

  const float voltageV = static_cast<float>(rawV) * 0.00125f;
  int16_t signedShunt = static_cast<int16_t>(rawS);
  const float shuntV = static_cast<float>(signedShunt) * 0.0000025f;
  *currentA = shuntV / shuntOhm_;
  *powerW = voltageV * (*currentA);
  return true;
}

}  // namespace sensors
