#include <cstdio>

#include "comms/lora.h"
#include "config.h"
#include "imaging/camera.h"
#include "imaging/queue.h"

int main() {
  comms::LoRaTransceiver lora;
  imaging::Camera camera;
  imaging::ImageQueue queue;

  if (!camera.init()) {
    return 1;
  }
  if (!lora.init()) {
    return 1;
  }

  std::printf("[Main] Inicio etapa 1: captura estereo + anaglifo onboard + envio LoRa\n");

  for (int photoIndex = 0; photoIndex < config::kCaptureCount; ++photoIndex) {
    auto jpegBytes = camera.capture();
    if (!jpegBytes.has_value()) {
      std::printf("[Main] Foto %d fallida, continuando\n", photoIndex);
      continue;
    }

    if (!queue.enqueueImage(jpegBytes.value())) {
      std::printf("[Main] Foto %d no encolada\n", photoIndex);
      continue;
    }

    while (queue.hasPending()) {
      auto fragment = queue.popFragment();
      if (!fragment.has_value()) {
        break;
      }

      if (!lora.sendPacket(fragment.value())) {
        std::printf("[Main] Error de envio, deteniendo corrida\n");
        return 1;
      }
      lora.delayMs(config::kInterPacketDelayMs);
    }

    if (photoIndex + 1 < config::kCaptureCount) {
      lora.delayMs(config::kCaptureIntervalMs);
    }
  }

  std::printf("[Main] Etapa 1 finalizada\n");
  return 0;
}
