# On-Board Computer (OBC)

C++ firmware for the CanSat's onboard computer running on a Raspberry Pi Zero 2W. Manages the full mission lifecycle: sensor acquisition, stereo imaging, LoRa telemetry, and servo deployment.

## Data Flow

```
sensors (I2C) ─┐
camera (USB) ──┤ → on-board-computer (FSM) → LoRa (433 MHz) → ground station ESP32
servos (GPIO) ─┘
```

## Build

```bash
cmake -S . -B build
cmake --build build -j4
```

Requires: `RadioLib`, `lgpio`, `libjpeg`. Built with C++17 and CMake 3.18+.

## Mission FSM

| State | Description |
|---|---|
| **Init** | Sensor initialization, non-abort on failure |
| **Idle** | Ground wait — builds pressure baseline. Transitions to Ascent when altitude > 3m for 3 consecutive readings |
| **Ascent** | Captures stereo photos at milestones (10/30/50/100/200m). Transmits telemetry + image fragments. Transitions at altitude ≥ 300m or freefall detection (accel < 3 m/s²) |
| **FreeFall** | Descending — discards image queue, telemetry-only at 5 Hz. Deploys servos at ≤ 200m with descent speed > 0.2 m/s |
| **Landing** | Detected by impact (accel > 25 m/s²) + stable altitude near baseline. 30s telemetry countdown |
| **MissionComplete** | Terminal state — loop stops |

## Hardware

| Component | Interface | Address/Pins |
|---|---|---|
| Raspberry Pi Zero 2W | — | Main processor |
| SX1278 LoRa | SPI | NSS=GPIO24, DIO0=GPIO25, RST=GPIO22, SCK=GPIO11, MOSI=GPIO10, MISO=GPIO9 |
| MS5611 altimeter | I2C | 0x76 or 0x77 |
| BME280 environment | I2C | 0x76 or 0x77 |
| BMI160 IMU | I2C | 0x68 or 0x69 |
| MMC5603 magnetometer | I2C | 0x30 |
| INA226 power monitor | I2C | 0x40–0x45 |
| Stereo USB camera | USB | `/dev/video0`, 2560×720 SBS |
| Servo 1 (deploy) | GPIO | GPIO18, 50 Hz PWM |
| Servo 2 (deploy) | GPIO | GPIO13, 50 Hz PWM |

## LoRa Configuration

| Param | Value |
|---|---|
| Frequency | 433.0 MHz |
| Bandwidth | 250 kHz |
| Spreading Factor | 7 |
| Coding Rate | 4/5 |
| TX Power | +17 dBm |
| Payload | 100 bytes max |

## Telemetry

- **Rate**: 5 Hz (200 ms period)
- **Packet types**: telemetry (type `0x02`), image fragment (type `0x01`), image start/end markers (`0x10`/`0x11`)
- **Encoding**: big-endian fixed-point integers

## Image Pipeline

1. Capture SBS stereo (2560×720) via `fswebcam`
2. Split left/right halves, resize to 320×240
3. Create red-cyan anaglyph (left=red, right=cyan)
4. Encode as JPEG (quality 65)
5. Fragment into 94-byte chunks
6. Transmit interleaved with telemetry packets

## Project Structure

```
on-board-computer/
├── CMakeLists.txt
├── config.h                     # All mission constants
├── src/
│   ├── main.cpp                 # Entry point
│   ├── comms/lora.cpp/.h        # SX1278 LoRa driver (RadioLib)
│   ├── comms/packet.cpp/.h      # Telemetry & image packet builders
│   ├── control/servos.cpp/.h    # Servo PWM (lgpio)
│   ├── fsm/machine.cpp/.h       # Mission FSM logic
│   ├── fsm/states.h             # State enum
│   └── imaging/
│       ├── camera.cpp/.h        # Stereo capture → anaglyph (fswebcam + libjpeg)
│       └── queue.cpp/.h         # Image fragment transmit queue
├── sensors/
│   ├── i2c_bus.cpp/.h           # Linux I2C abstraction
│   ├── altimeter.cpp/.h         # MS5611
│   ├── environment.cpp/.h       # BME280
│   ├── imu.cpp/.h               # BMI160
│   ├── magnetometer.cpp/.h      # MMC5603
│   └── power.cpp/.h             # INA226
├── logs/
└── tmp/
```
