#include "comms/lora.h"

#include <cstdio>

#include <RadioLib.h>
#include "config.h"
#include "hal/RPi/PiHal.h"

namespace comms {

LoRaTransceiver::LoRaTransceiver()
    : hal_(new PiHal(config::kSpiChannel)),
      module_(new Module(hal_, config::kLoraNssPin, config::kLoraDio0Pin, config::kLoraRstPin, RADIOLIB_NC)),
      radio_(new SX1278(module_)),
      initialized_(false) {}

LoRaTransceiver::~LoRaTransceiver() {
  delete radio_;
  delete module_;
  delete hal_;
}

bool LoRaTransceiver::init() {
  std::printf("[LoRa] Inicializando SX1278...\n");
  const int state = radio_->begin(
      config::kLoraFrequencyMhz,
      config::kLoraBandwidthKhz,
      config::kLoraSpreadingFactor,
      config::kLoraCodingRate,
      config::kLoraSyncWord,
      config::kLoraTxPowerDbm,
      config::kLoraPreambleLength,
      config::kLoraGain);
  if (state != RADIOLIB_ERR_NONE) {
    std::printf("[LoRa] Error begin(): %d\n", state);
    return false;
  }

  if (config::kLoraEnableCrc) {
    const int crcState = radio_->setCRC(true);
    if (crcState != RADIOLIB_ERR_NONE) {
      std::printf("[LoRa] Error setCRC(): %d\n", crcState);
      return false;
    }
  }

  initialized_ = true;
  std::printf("[LoRa] OK\n");
  return true;
}

bool LoRaTransceiver::sendPacket(const std::vector<uint8_t>& payload) {
  if (!initialized_) {
    std::printf("[LoRa] No inicializado\n");
    return false;
  }
  if (payload.empty() || payload.size() > config::kMaxLoraPayloadBytes) {
    std::printf("[LoRa] Payload invalido (%zu bytes)\n", payload.size());
    return false;
  }

  const int state = radio_->transmit(payload.data(), payload.size());
  if (state != RADIOLIB_ERR_NONE) {
    std::printf("[LoRa] Error transmit(): %d\n", state);
    return false;
  }
  return true;
}

void LoRaTransceiver::delayMs(unsigned long ms) const {
  hal_->delay(ms);
}

}  // namespace comms
