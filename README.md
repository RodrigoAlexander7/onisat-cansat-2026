# CanSat LoRa Transmission System

Complete telemetry and imaging system for a CanSat mission, from onboard sensors to ground station dashboard.

## Data Flow

```
on-board-computer (Raspberry Pi Zero 2W)
  │
  │ LoRa (433 MHz, SX1278)
  ▼
esp (ESP32-S3 ground receiver)
  │
  │ USB Serial (115200 baud, RTS protocol)
  ▼
backend (Python WebSocket + serial bridge)
  │
  │ WebSocket (JSON, ws://localhost:8080)
  ▼
frontend (Next.js real-time dashboard)
```

## Project Structure

| Directory | Description |
|---|---|
| `on-board-computer/` | C++ firmware for the CanSat OBC — reads sensors, captures stereo images, runs mission FSM, transmits over LoRa |
| `ground-station/backend/` | Python backend — receives serial data from ESP, logs telemetry to CSV, reassembles images, serves frontend via WebSocket |
| `ground-station/esp/` | Arduino firmware for ESP32-S3 — LoRa receiver bridging packets to USB serial |
| `ground-station/frontend/` | Next.js TypeScript dashboard — real-time charts, 3D CanSat render, image gallery |
| `docs/` | Architecture documentation, wiring diagrams, camera pipeline |
| `utils/emu/` | Docker cross-compilation environment for the OBC |
| `utils/rasp/` | Raspberry Pi test scripts and LoRa transmit test |

## Components

- **on-board-computer** — C++17/CMake on Raspberry Pi Zero 2W. Sensors: MS5611 (altimeter), BME280 (env), BMI160 (IMU), MMC5603 (magnetometer), INA226 (power). Stereo USB camera → red-cyan anaglyph JPEG. Mission FSM: Init → Idle → Ascent → FreeFall → Landing → MissionComplete. Telemetry at 5 Hz, image fragments interleaved.
- **esp** — Arduino firmware on ESP32-S3. SX1278 LoRa receiver at 433 MHz. Forwards packets over serial via `RTS,<seq>,<len>,<hexdata>,END` protocol.
- **backend** — Python 3 with `pyserial`, `websockets`, `opencv`. Reads serial frames, parses binary telemetry/image packets, logs to CSV, reassembles JPEG images (with OpenCV inpainting for lost fragments), broadcasts JSON over WebSocket.
- **frontend** — Next.js 16 (App Router), React 19, TypeScript, Zustand, uPlot charts, Three.js 3D render. Real-time telemetry display, mission state tracking, image gallery.

## Getting Started

### Backend

```bash
cd ground-station/backend
python recv_images.py
```

### Frontend

```bash
cd ground-station/frontend
pnpm install
pnpm dev
```

### OBC (cross-compile)

```bash
cd utils/emu
./init.sh
```

## Hardware

- **OBC**: Raspberry Pi Zero 2W + SX1278 LoRa + stereo USB camera + I2C sensor board + 2 servos
- **Ground receiver**: ESP32-S3 + SX1278 LoRa
- **Ground station**: PC running backend + frontend
