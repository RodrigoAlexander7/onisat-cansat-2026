#include "magnetometer.h"

#include <cstdio>
#include <unistd.h>

namespace sensors {

namespace {
constexpr uint8_t kCandidates[] = {0x30};
}

Magnetometer::Magnetometer(I2cBus* bus) : bus_(bus), addr_(0), available_(false) {}

bool Magnetometer::init() {
  available_ = false;
  for (uint8_t addr : kCandidates) {
    uint8_t prod = 0;
    if (!bus_->readByte(addr, 0x39, &prod)) {
      continue;
    }
    // MMC5603 PRODUCT_ID expected 0x10
    if (prod != 0x10) {
      continue;
    }
    bus_->writeByte(addr, 0x1B, 0x01);  // set
    usleep(2000);
    bus_->writeByte(addr, 0x1C, 0x01);  // reset
    usleep(2000);
    addr_ = addr;
    available_ = true;
    std::printf("[MMC5603] OK @0x%02X\n", addr_);
    return true;
  }
  std::printf("[MMC5603] No detectado\n");
  return false;
}

bool Magnetometer::isAvailable() const { return available_; }

bool Magnetometer::read(float* mx, float* my, float* mz) {
  if (!available_) {
    return false;
  }
  if (!bus_->writeByte(addr_, 0x1B, 0x01)) {  // start meas
    return false;
  }
  usleep(10000);

  uint8_t raw[9] = {0};
  if (!bus_->readBytes(addr_, 0x00, raw, sizeof(raw))) {
    return false;
  }

  uint32_t x = (static_cast<uint32_t>(raw[0]) << 12) |
               (static_cast<uint32_t>(raw[1]) << 4) |
               (raw[6] >> 4);
  uint32_t y = (static_cast<uint32_t>(raw[2]) << 12) |
               (static_cast<uint32_t>(raw[3]) << 4) |
               (raw[7] >> 4);
  uint32_t z = (static_cast<uint32_t>(raw[4]) << 12) |
               (static_cast<uint32_t>(raw[5]) << 4) |
               (raw[8] >> 4);

  // offset binary 20-bit -> signed around 2^19
  int32_t xs = static_cast<int32_t>(x) - 524288;
  int32_t ys = static_cast<int32_t>(y) - 524288;
  int32_t zs = static_cast<int32_t>(z) - 524288;

  // approx 0.0625 uT / LSB
  *mx = static_cast<float>(xs) * 0.0625f;
  *my = static_cast<float>(ys) * 0.0625f;
  *mz = static_cast<float>(zs) * 0.0625f;
  return true;
}

}  // namespace sensors
