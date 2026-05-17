#include "power.h"

#include <cstdio>

namespace sensors {

namespace {
constexpr uint8_t kCandidates[] = {0x40, 0x41, 0x44, 0x45};
}

Power::Power(I2cBus* bus) : bus_(bus), addr_(0), available_(false) {}

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
    uint16_t manu = 0;
    if (!readRegister16(0xFE, &manu)) {
      continue;
    }
    if (manu != 0x5449) {
      continue;
    }

    // INA226 config: avg=16, VBUSCT=1.1ms, VSHCT=1.1ms, continuous shunt+bus
    const uint8_t configReg[2] = {0x44, 0x67};
    bus_->writeBytes(addr_, 0x00, configReg, 2);
    // calibration for 0.1 ohm shunt, current_lsb = 1mA (CAL=0x0100)
    const uint8_t calReg[2] = {0x01, 0x00};
    bus_->writeBytes(addr_, 0x05, calReg, 2);

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
  uint16_t currentRaw = 0;
  uint16_t powerRaw = 0;
  if (!readRegister16(0x04, &currentRaw) || !readRegister16(0x03, &powerRaw)) {
    return false;
  }
  int16_t signedCurrent = static_cast<int16_t>(currentRaw);
  // current_lsb 1 mA, power_lsb 25 mW with this config
  *currentA = static_cast<float>(signedCurrent) * 0.001f;
  *powerW = static_cast<float>(powerRaw) * 0.025f;
  return true;
}

}  // namespace sensors
