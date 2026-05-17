#include <SPI.h>
#include <RadioLib.h>

// NSS=10, DIO0=5, RST=4, DIO1 no conectado
SX1278 radio = new Module(10, 5, 4, RADIOLIB_NC, SPI);

void setup() {
  Serial.begin(115200);
  delay(1000);

  // SCK=12, MISO=13, MOSI=11, SS=10
  SPI.begin(12, 13, 11, 10);

  Serial.print("[SX1278 RX] Init... ");
  int state = radio.begin(433.0, 125.0, 9, 7, 0x12, 10, 8, 0);
  if (state != RADIOLIB_ERR_NONE) {
    Serial.print("ERROR ");
    Serial.println(state);
    while (true) { delay(1000); }
  }
  Serial.println("OK");
}

void loop() {
  String str;
  int state = radio.receive(str);

  if (state == RADIOLIB_ERR_NONE) {
    Serial.print("[RX] ");
    Serial.println(str);
    Serial.print("RSSI: ");
    Serial.print(radio.getRSSI());
    Serial.print(" dBm | SNR: ");
    Serial.print(radio.getSNR());
    Serial.println(" dB");
  } else if (state == RADIOLIB_ERR_RX_TIMEOUT) {
    Serial.println("[RX] timeout");
  } else {
    Serial.print("[RX] ERROR ");
    Serial.println(state);
  }
}
