#include <cstdio>
#include <RadioLib.h>
#include "hal/RPi/PiHal.h"

// SPI CE0 (GPIO8)
PiHal* hal = new PiHal(1);

// NSS=GPIO8, DIO0=GPIO25, RST=GPIO22, DIO1 no conectado
SX1278 radio = new Module(hal, 7, 25, 22, RADIOLIB_NC);

int main() {
  std::printf("[SX1278 TX] Init...\n");
  int state = radio.begin(433.0, 125.0, 9, 7, 0x12, 10, 8, 0);
  if (state != RADIOLIB_ERR_NONE) {
    std::printf("[SX1278 TX] Error init: %d\n", state);
    return 1;
  }
  std::printf("[SX1278 TX] OK\n");

  int counter = 0;
  while (true) {
    char msg[64];
    std::snprintf(msg, sizeof(msg), "hola mundo #%d", counter++);

    std::printf("[SX1278 TX] Enviando: %s ... ", msg);
    state = radio.transmit(msg);
    if (state == RADIOLIB_ERR_NONE) {
      std::printf("OK\n");
    } else {
      std::printf("ERROR %d\n", state);
    }

    hal->delay(2000);
  }
}
