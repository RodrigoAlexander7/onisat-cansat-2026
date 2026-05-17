#include "imu.h"

#include <cstdio>
#include <unistd.h>

namespace sensors {

namespace {
constexpr uint8_t kCandidates[] = {0x68, 0x69};
}

Imu::Imu(I2cBus* bus) : bus_(bus), addr_(0), available_(false) {}

bool Imu::init() {
  available_ = false;
  for (uint8_t addr : kCandidates) {
    uint8_t chipId = 0;
    if (!bus_->readByte(addr, 0x00, &chipId) || chipId != 0xD1) {
      continue;
    }

    // BMI160 command register
    bus_->writeByte(addr, 0x7E, 0x11);  // ACC normal
    usleep(5000);
    bus_->writeByte(addr, 0x7E, 0x15);  // GYR normal
    usleep(5000);
    // accel range ±2g, gyro ±250 dps
    bus_->writeByte(addr, 0x41, 0x03);
    bus_->writeByte(addr, 0x43, 0x03);

    addr_ = addr;
    available_ = true;
    std::printf("[BMI160] OK @0x%02X\n", addr_);
    return true;
  }
  std::printf("[BMI160] No detectado\n");
  return false;
}

bool Imu::isAvailable() const { return available_; }

bool Imu::read(float* ax, float* ay, float* az, float* gx, float* gy, float* gz) {
  if (!available_) {
    return false;
  }
  uint8_t raw[12] = {0};
  if (!bus_->readBytes(addr_, 0x0C, raw, sizeof(raw))) {
    return false;
  }

  auto toS16 = [](uint8_t lo, uint8_t hi) -> int16_t {
    return static_cast<int16_t>((hi << 8) | lo);
  };

  int16_t gxr = toS16(raw[0], raw[1]);
  int16_t gyr = toS16(raw[2], raw[3]);
  int16_t gzr = toS16(raw[4], raw[5]);
  int16_t axr = toS16(raw[6], raw[7]);
  int16_t ayr = toS16(raw[8], raw[9]);
  int16_t azr = toS16(raw[10], raw[11]);

  // ±2g => 16384 LSB/g, convert to m/s^2
  constexpr float kAccScale = 9.80665f / 16384.0f;
  // ±250 dps => 131.2 LSB/(deg/s)
  constexpr float kGyrScale = 1.0f / 131.2f;

  *ax = static_cast<float>(axr) * kAccScale;
  *ay = static_cast<float>(ayr) * kAccScale;
  *az = static_cast<float>(azr) * kAccScale;
  *gx = static_cast<float>(gxr) * kGyrScale;
  *gy = static_cast<float>(gyr) * kGyrScale;
  *gz = static_cast<float>(gzr) * kGyrScale;
  return true;
}

}  // namespace sensors
