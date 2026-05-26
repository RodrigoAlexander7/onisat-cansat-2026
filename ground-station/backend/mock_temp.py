import asyncio
import csv
import json
import os
import time
from pathlib import Path

import websockets

CSV_PATH = Path(__file__).with_name("sensors_parsed_new.csv")
SEND_HZ = float(os.getenv("TELEMETRY_HZ", "10"))
SEND_INTERVAL_S = 1.0 / SEND_HZ

CSV_TO_PAYLOAD = {
    "pres_ms5611_Pa": "pres_ms5611",
    "temp_bme280_C": "temp_bme280",
    "hum_bme280_pct": "hum_bme280",
    "accel_x_ms2": "accel_x",
    "accel_y_ms2": "accel_y",
    "accel_z_ms2": "accel_z",
    "gyro_x_dps": "gyro_x",
    "gyro_y_dps": "gyro_y",
    "gyro_z_dps": "gyro_z",
    "mag_x_uT": "mag_x",
    "mag_y_uT": "mag_y",
    "mag_z_uT": "mag_z",
    "current_ina226_A": "current_ina226",
    "power_ina226_W": "power_ina226",
}


def parse_float(value):
    if value is None:
        return None
    stripped = value.strip()
    if not stripped:
        return None
    return float(stripped)


def load_csv_rows(csv_path: Path):
    with csv_path.open("r", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        rows = []
        for row in reader:
            entry = {}
            for csv_key, payload_key in CSV_TO_PAYLOAD.items():
                entry[payload_key] = parse_float(row.get(csv_key))
            rows.append(entry)
        return rows


def make_telemetry_loop(rows):
    async def telemetry_loop(websocket):
        start_time = time.monotonic()
        packets = -100
        row_index = 0
        last_values = {key: 0.0 for key in CSV_TO_PAYLOAD.values()}

        while True:
            try:
                elapsed_ms = (time.monotonic() - start_time) * 1000.0

                row = rows[row_index]
                row_index = (row_index + 1) % len(rows)

                payload = {"timestamp_ms": elapsed_ms, "packets_received": packets}
                for key, value in row.items():
                    if value is None:
                        payload[key] = last_values.get(key, 0.0)
                    else:
                        payload[key] = value
                        last_values[key] = value

                pres = payload.get("pres_ms5611", 101325.0)
                alt_m = 44330.0 * (1.0 - (pres / 101325.0) ** 0.1903)
                payload["alt_ms5611"] = alt_m

                dt = (
                    elapsed_ms
                    - last_values.get(
                        "last_time_ms", elapsed_ms - SEND_INTERVAL_S * 1000.0
                    )
                ) / 1000.0
                if dt > 0:
                    dAlt = alt_m - last_values.get("last_alt", alt_m)
                    vel_z = dAlt / dt
                else:
                    vel_z = 0.0
                payload["velocity_z"] = vel_z

                last_values["last_alt"] = alt_m
                last_values["last_time_ms"] = elapsed_ms

                await websocket.send(json.dumps(payload))
                packets += 1
                await asyncio.sleep(SEND_INTERVAL_S)
            except websockets.exceptions.ConnectionClosed:
                break

    return telemetry_loop


async def main():
    rows = load_csv_rows(CSV_PATH)
    if not rows:
        raise RuntimeError("sensors_mock_new.csv is empty or missing data rows")

    telemetry_loop = make_telemetry_loop(rows)
    async with websockets.serve(telemetry_loop, "localhost", 8080):
        print("Mock CanSat Telemetry running on ws://localhost:8080")
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    asyncio.run(main())
