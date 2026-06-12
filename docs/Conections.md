### Conexion table — ESP32-S3 ↔ ESP32-S3 / LoRa
| Módulo LoRa-02 SX1278 433MHz | ESP32-S3 |
| ---------------------------- | -------- |
| MISO                         | 13       |
| SCK                          | 12       |
| MOSI                         | 11       |
| NSS                          | 10       |
| DIO0                         | 5        |
| RST                          | 4        |
| 3.3V                         | 3V3      |
| GND                         | GND      |


### Conexion table — Raspberry Pi Zero 2W ↔ ESP32-S3 / LoRa
|Physic Pin Raspberry Pi Zero 2W | GPIO (BCM) | Señal / Pin |
| ------------------------------- | ---------- | ----------- |
| 1                               | 3.3V       | 3.3V        |
| 15                              | GPIO22     | RST         |
| 19                              | GPIO10     | MOSI        |
| 21                              | GPIO9      | MISO        |
| 22                              | GPIO25     | DIO0        |
| 23                              | GPIO11     | SCK         |
| 18                              | GPIO24     | NSS         |
| 39                              | GND        | GND         |

### The pin 24 is changed and we use 18 (24GPIO) instead cause is used by the Linux System of the Rasp
| 24                              | GPIO8      | NSS         | -> Changed


### Conexion table — Raspberry Pi Zero 2W ↔ Placa Sensors
| Raspberry Pi Zero 2W | Señal | Placa Sensors |
| -------------------- | ----- | ------------- |
| 5 (GPIO3 / SCL)      | SCL   | 3 (SCL)       |
| 3 (GPIO2 / SDA)      | SDA   | 4 (SDA)       |
| 9 (GND)              | GND   | 5 (GND)       |
| 17 (3.3V)            | 3.3V  | 7 (3.3V)      |


### Conexion table — Raspberry Pi Zero 2W ↔ Servos
| Raspberry Pi Zero 2W | GPIO | Servos |
| -------------------- | ----- | ---------------------- |
| Pin físico 32(PWM0) | GPIO12  | Servo 01 Cable de Data (30 grados de movimiento)  |
| Pin físico 33(PWM1) | GPIO13  | Servo 02 Cable de Data (75 grados de movimiento)  |
