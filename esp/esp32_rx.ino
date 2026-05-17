#include <SPI.h>
#include <RadioLib.h>

// ESP32-S3 + SX1278
// MISO=13, SCK=12, MOSI=11, NSS=10, DIO0=5, RST=4
SX1278 radio = new Module(10, 5, 4, RADIOLIB_NC, SPI);

volatile bool receivedFlag = false;
volatile bool enableInterrupt = true;
uint32_t frameSeq = 0;

void setFlag(void) {
  if (!enableInterrupt) {
    return;
  }
  receivedFlag = true;
}

void printHexByte(uint8_t value) {
  const char* hex = "0123456789ABCDEF";
  Serial.print(hex[(value >> 4) & 0x0F]);
  Serial.print(hex[value & 0x0F]);
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  SPI.begin(12, 13, 11, 10);

  int state = radio.begin(433.0, 250.0, 7, 5, 0x12, 17, 8, 0);
  if (state != RADIOLIB_ERR_NONE) {
    Serial.print("ERR_INIT,");
    Serial.println(state);
    while (true) {
      delay(1000);
    }
  }

  radio.setCRC(true);
  radio.setDio0Action(setFlag);
  state = radio.startReceive();
  if (state != RADIOLIB_ERR_NONE) {
    Serial.print("ERR_START_RX,");
    Serial.println(state);
    while (true) {
      delay(1000);
    }
  }

  Serial.println("BRIDGE_READY");
}

void loop() {
  if (!receivedFlag) {
    return;
  }

  enableInterrupt = false;
  receivedFlag = false;

  int packetLength = radio.getPacketLength();
  if (packetLength <= 0 || packetLength > 255) {
    Serial.print("ERR_LEN,");
    Serial.println(packetLength);
    radio.startReceive();
    enableInterrupt = true;
    return;
  }

  uint8_t data[255];
  int state = radio.readData(data, packetLength);
  if (state == RADIOLIB_ERR_NONE) {
    Serial.print("RTS,");
    Serial.print(frameSeq++);
    Serial.print(",");
    Serial.print(packetLength);
    Serial.print(",");
    for (int i = 0; i < packetLength; ++i) {
      printHexByte(data[i]);
    }
    Serial.println(",END");
  } else if (state == RADIOLIB_ERR_CRC_MISMATCH) {
    Serial.println("ERR_CRC");
  } else {
    Serial.print("ERR_RX,");
    Serial.println(state);
  }

  radio.startReceive();
  enableInterrupt = true;
}
