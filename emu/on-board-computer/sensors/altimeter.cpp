#include "altimeter.h"

#include <cmath>
#include <cstdio>
#include <unistd.h>

namespace sensors {

namespace {
constexpr uint8_t kCandidates[] = {0x77, 0x76};
}

Altimeter::Altimeter(I2cBus* bus) : bus_(bus), addr_(0), available_(false), c_{0} {}

bool Altimeter::init() {
  available_ = false;
  for (uint8_t addr : kCandidates) {
    bool ok = bus_->writeCommand(addr, 0x1E);  // reset
    if (!ok) {
      continue;
    }
    usleep(3000);

    bool promOk = true;
    for (int i = 1; i <= 6; ++i) {
      uint8_t data[2] = {0};
      if (!bus_->readBytes(addr, static_cast<uint8_t>(0xA0 + i * 2), data, 2)) {
        promOk = false;
        break;
      }
      c_[i] = static_cast<uint16_t>((data[0] << 8) | data[1]);
      if (c_[i] == 0 || c_[i] == 0xFFFF) {
        promOk = false;
      }
    }
    if (promOk) {
      addr_ = addr;
      available_ = true;
      std::printf("[MS5611] OK @0x%02X\n", addr_);
      return true;
    }
  }
  std::printf("[MS5611] No detectado\n");
  return false;
}

bool Altimeter::isAvailable() const {
  return available_;
}

bool Altimeter::readAdc(uint8_t command, uint32_t* value) {
  if (!available_) {
    return false;
  }
  if (!bus_->writeCommand(addr_, command)) {
    return false;
  }
  usleep(10000);
  uint8_t raw[3] = {0};
  if (!bus_->readBytes(addr_, 0x00, raw, 3)) {
    return false;
  }
  *value = (static_cast<uint32_t>(raw[0]) << 16) |
           (static_cast<uint32_t>(raw[1]) << 8) |
           static_cast<uint32_t>(raw[2]);
  return true;
}

float Altimeter::readPressurePa() {
  if (!available_) {
    return NAN;
  }
  uint32_t d1 = 0;
  uint32_t d2 = 0;
  if (!readAdc(0x48, &d1) || !readAdc(0x58, &d2)) {
    return NAN;
  }

  int64_t dT = static_cast<int64_t>(d2) - (static_cast<int64_t>(c_[5]) << 8);
  int64_t off = (static_cast<int64_t>(c_[2]) << 16) + ((static_cast<int64_t>(c_[4]) * dT) >> 7);
  int64_t sens = (static_cast<int64_t>(c_[1]) << 15) + ((static_cast<int64_t>(c_[3]) * dT) >> 8);
  int64_t p = (((static_cast<int64_t>(d1) * sens) >> 21) - off) >> 15;
  return static_cast<float>(p);
}

float Altimeter::readTemperatureC() {
  if (!available_) {
    return NAN;
  }
  uint32_t d2 = 0;
  if (!readAdc(0x58, &d2)) {
    return NAN;
  }
  int64_t dT = static_cast<int64_t>(d2) - (static_cast<int64_t>(c_[5]) << 8);
  int64_t temp = 2000 + ((dT * c_[6]) >> 23);
  return static_cast<float>(temp) / 100.0f;
}

float Altimeter::getAltitudeMeters(float refPressurePa) {
  const float pressure = readPressurePa();
  if (!std::isfinite(pressure) || refPressurePa <= 0.0f) {
    return NAN;
  }
  return 44330.0f * (1.0f - std::pow(pressure / refPressurePa, 0.19029495f));
}

}  // namespace sensors
