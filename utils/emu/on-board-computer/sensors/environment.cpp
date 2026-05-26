#include "environment.h"

#include <cstdio>
#include <unistd.h>

namespace sensors {

namespace {
constexpr uint8_t kCandidates[] = {0x76, 0x77};
}

Environment::Environment(I2cBus* bus)
    : bus_(bus),
      addr_(0),
      available_(false),
      digT1_(0),
      digT2_(0),
      digT3_(0),
      digH1_(0),
      digH2_(0),
      digH3_(0),
      digH4_(0),
      digH5_(0),
      digH6_(0) {}

bool Environment::init() {
  available_ = false;
  for (uint8_t addr : kCandidates) {
    uint8_t chipId = 0;
    if (!bus_->readByte(addr, 0xD0, &chipId) || chipId != 0x60) {
      continue;
    }

    uint8_t calib1[24] = {0};
    uint8_t calib2[7] = {0};
    uint8_t h1 = 0;
    if (!bus_->readBytes(addr, 0x88, calib1, sizeof(calib1)) ||
        !bus_->readByte(addr, 0xA1, &h1) ||
        !bus_->readBytes(addr, 0xE1, calib2, sizeof(calib2))) {
      continue;
    }

    digT1_ = static_cast<uint16_t>(calib1[1] << 8 | calib1[0]);
    digT2_ = static_cast<int16_t>(calib1[3] << 8 | calib1[2]);
    digT3_ = static_cast<int16_t>(calib1[5] << 8 | calib1[4]);
    digH1_ = h1;
    digH2_ = static_cast<int16_t>(calib2[1] << 8 | calib2[0]);
    digH3_ = calib2[2];
    digH4_ = static_cast<int16_t>((calib2[3] << 4) | (calib2[4] & 0x0F));
    digH5_ = static_cast<int16_t>((calib2[5] << 4) | (calib2[4] >> 4));
    digH6_ = static_cast<int8_t>(calib2[6]);

    bus_->writeByte(addr, 0xF2, 0x01);
    bus_->writeByte(addr, 0xF4, 0x27);
    bus_->writeByte(addr, 0xF5, 0xA0);
    usleep(2000);

    addr_ = addr;
    available_ = true;
    std::printf("[BME280] OK @0x%02X\n", addr_);
    return true;
  }
  std::printf("[BME280] No detectado\n");
  return false;
}

bool Environment::isAvailable() const { return available_; }

bool Environment::read(float* temperatureC, float* humidityPct) {
  if (!available_) {
    return false;
  }
  uint8_t raw[8] = {0};
  if (!bus_->readBytes(addr_, 0xF7, raw, sizeof(raw))) {
    return false;
  }

  int32_t adcT = (static_cast<int32_t>(raw[3]) << 12) |
                 (static_cast<int32_t>(raw[4]) << 4) |
                 (raw[5] >> 4);
  int32_t adcH = (static_cast<int32_t>(raw[6]) << 8) | raw[7];

  int32_t var1 = ((((adcT >> 3) - (static_cast<int32_t>(digT1_) << 1))) *
                  static_cast<int32_t>(digT2_)) >>
                 11;
  int32_t var2 =
      (((((adcT >> 4) - static_cast<int32_t>(digT1_)) *
         ((adcT >> 4) - static_cast<int32_t>(digT1_))) >>
        12) *
       static_cast<int32_t>(digT3_)) >>
      14;
  int32_t tFine = var1 + var2;
  int32_t t = (tFine * 5 + 128) >> 8;
  *temperatureC = static_cast<float>(t) / 100.0f;

  int32_t v_x1_u32r = tFine - 76800;
  v_x1_u32r = (((((adcH << 14) - (static_cast<int32_t>(digH4_) << 20) -
                  (static_cast<int32_t>(digH5_) * v_x1_u32r)) +
                 16384) >>
                15) *
               (((((((v_x1_u32r * static_cast<int32_t>(digH6_)) >> 10) *
                    (((v_x1_u32r * static_cast<int32_t>(digH3_)) >> 11) +
                     32768)) >>
                   10) +
                  2097152) *
                     static_cast<int32_t>(digH2_) +
                 8192) >>
                14));
  v_x1_u32r =
      v_x1_u32r - (((((v_x1_u32r >> 15) * (v_x1_u32r >> 15)) >> 7) *
                    static_cast<int32_t>(digH1_)) >>
                   4);
  v_x1_u32r = (v_x1_u32r < 0 ? 0 : v_x1_u32r);
  v_x1_u32r = (v_x1_u32r > 419430400 ? 419430400 : v_x1_u32r);
  *humidityPct = static_cast<float>(v_x1_u32r >> 12) / 1024.0f;
  return true;
}

}  // namespace sensors
