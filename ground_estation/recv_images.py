import asyncio
import json
import os
import threading
import time

import serial
import websockets

PORT = os.getenv("SERIAL_PORT", "/dev/ttyACM0")
BAUD = int(os.getenv("SERIAL_BAUD", "115200"))
WS_HOST = os.getenv("WS_HOST", "localhost")
WS_PORT = int(os.getenv("WS_PORT", "8080"))
OUT_DIR = "received_images"

PKT_TYPE_IMAGE_FRAGMENT = 0x01
PKT_TYPE_TELEMETRY = 0x02
PKT_TYPE_IMAGE_START = 0x10
PKT_TYPE_IMAGE_END = 0x11

os.makedirs(OUT_DIR, exist_ok=True)

# image_id -> {"total": int, "total_bytes": int, "frags": {idx: bytes}, "seen_end": bool}
images = {}

# transmission metrics
packets_received = 0
packets_lost = 0
last_bridge_seq = None

# telemetry derivates
last_altitude = 0.0
last_time_ms = 0.0

frontend_loop = None
frontend_queue = None
connected_clients = set()


def save_partial_image(image_id, entry, missing):
    total = entry["total"]
    frags = entry["frags"]
    total_bytes = entry["total_bytes"]

    if frags:
        default_chunk_size = max(len(chunk) for chunk in frags.values())
    else:
        default_chunk_size = 94

    data_parts = []
    for idx in range(total):
        if idx in frags:
            data_parts.append(frags[idx])
            continue

        if total_bytes and idx == total - 1:
            expected_len = max(0, total_bytes - default_chunk_size * (total - 1))
        else:
            expected_len = default_chunk_size
        data_parts.append(b"\x00" * expected_len)

    data = b"".join(data_parts)
    if total_bytes:
        data = data[:total_bytes]

    partial_path = os.path.join(OUT_DIR, f"image_{image_id:03d}.partial.jpg")
    with open(partial_path, "wb") as file:
        file.write(data)

    miss_path = os.path.join(OUT_DIR, f"image_{image_id:03d}.missing.txt")
    with open(miss_path, "w", encoding="utf-8") as file:
        file.write(",".join(str(i) for i in missing))

    print(
        f"[PARTIAL] Guardada imagen parcial: {partial_path} ({len(data)} bytes), "
        f"faltan {len(missing)} fragmentos"
    )


def finalize_image(image_id):
    entry = images.get(image_id)
    if not entry:
        return

    total = entry["total"]
    frags = entry["frags"]
    missing = [i for i in range(total) if i not in frags]
    if missing:
        print(
            f"[MISS] img={image_id} faltan {len(missing)} fragmentos: "
            f"{missing[:12]}{'...' if len(missing) > 12 else ''}"
        )
        save_partial_image(image_id, entry, missing)
        del images[image_id]
        return

    data = b"".join(frags[i] for i in range(total))
    expected = entry["total_bytes"]
    if expected and expected != len(data):
        print(f"[WARN] img={image_id} bytes esperados={expected} recibidos={len(data)}")

    path = os.path.join(OUT_DIR, f"image_{image_id:03d}.jpg")
    with open(path, "wb") as file:
        file.write(data)
    print(f"[OK] Imagen 3D anaglifo completa: {path} ({len(data)} bytes)")
    del images[image_id]


def parse_rts_line(line):
    if not (line.startswith("RTS,") and line.endswith(",END")):
        return None
    body = line[4:-4]
    parts = body.split(",", 2)
    if len(parts) != 3:
        return None
    seq_str, packet_len_str, hexdata = parts
    try:
        bridge_seq = int(seq_str)
        packet_len = int(packet_len_str)
        raw = bytes.fromhex(hexdata)
    except ValueError:
        return None
    if packet_len != len(raw):
        return None
    return bridge_seq, raw


def u16(data, i):
    return (data[i] << 8) | data[i + 1]


def i16(data, i):
    v = u16(data, i)
    return v - 65536 if v > 32767 else v


def u32(data, i):
    return (data[i] << 24) | (data[i + 1] << 16) | (data[i + 2] << 8) | data[i + 3]


def i32(data, i):
    v = u32(data, i)
    return v - 4294967296 if v > 2147483647 else v


def update_transmission_metrics(bridge_seq):
    global packets_received, packets_lost, last_bridge_seq

    packets_received += 1
    if last_bridge_seq is not None and bridge_seq > last_bridge_seq + 1:
        packets_lost += bridge_seq - last_bridge_seq - 1
    last_bridge_seq = bridge_seq


def emit_to_frontend(payload):
    if frontend_loop is None or frontend_queue is None:
        return

    def _put():
        frontend_queue.put_nowait(payload)

    frontend_loop.call_soon_threadsafe(_put)


def serial_reader():
    global last_altitude, last_time_ms

    with serial.Serial(PORT, BAUD, timeout=1) as ser:
        print(f"Escuchando serial {PORT}...")
        while True:
            line = ser.readline().decode(errors="ignore").strip()
            if not line:
                continue

            parsed = parse_rts_line(line)
            if parsed is None:
                print(line)
                continue

            bridge_seq, raw = parsed
            update_transmission_metrics(bridge_seq)

            if len(raw) < 1:
                continue

            packet_type = raw[0]

            if packet_type == PKT_TYPE_TELEMETRY:
                if len(raw) < 39:
                    print(f"[TEL?] paquete telemetria corto len={len(raw)} hex={raw.hex()}")
                    continue

                ts = u32(raw, 1)
                seq = u16(raw, 6)
                pressure_pa = i32(raw, 8) / 10.0
                altitude_m = i16(raw, 12) / 10.0
                temp_c = i16(raw, 14) / 10.0
                hum_pct = raw[16]
                ax = i16(raw, 17) / 1000.0
                ay = i16(raw, 19) / 1000.0
                az = i16(raw, 21) / 1000.0
                gx = i16(raw, 23) / 1000.0
                gy = i16(raw, 25) / 1000.0
                gz = i16(raw, 27) / 1000.0
                mx = i16(raw, 29) / 10.0
                my = i16(raw, 31) / 10.0
                mz = i16(raw, 33) / 10.0
                current_a = u16(raw, 35) / 100.0
                power_w = u16(raw, 37) / 100.0

                if last_time_ms > 0 and ts > last_time_ms:
                    velocity_z = (altitude_m - last_altitude) / ((ts - last_time_ms) / 1000.0)
                else:
                    velocity_z = 0.0
                last_altitude = altitude_m
                last_time_ms = ts

                packets_transmitted = packets_received + packets_lost
                frontend_payload = {
                    "timestamp_ms": ts,
                    "packets_received": packets_received,
                    "packets_transmitted": packets_transmitted,
                    "packets_lost": packets_lost,
                    "pres_ms5611": pressure_pa,
                    "alt_ms5611": altitude_m,
                    "temp_bme280": temp_c,
                    "hum_bme280": hum_pct,
                    "accel_x": ax,
                    "accel_y": ay,
                    "accel_z": az,
                    "gyro_x": gx,
                    "gyro_y": gy,
                    "gyro_z": gz,
                    "mag_x": mx,
                    "mag_y": my,
                    "mag_z": mz,
                    "current_ina226": current_a,
                    "power_ina226": power_w,
                    "velocity_z": velocity_z,
                    "telemetry_seq": seq,
                }
                emit_to_frontend(frontend_payload)

                print(
                    f"[TEL] seq={seq} t={ts}ms alt={altitude_m:.1f}m pres={pressure_pa:.1f}Pa "
                    f"temp={temp_c:.1f}C hum={hum_pct}% I={current_a:.2f}A P={power_w:.2f}W "
                    f"tx={packets_transmitted} lost={packets_lost}"
                )
                continue

            if packet_type == PKT_TYPE_IMAGE_START:
                if len(raw) < 8:
                    continue
                image_id = raw[1]
                total_frags = raw[2]
                total_bytes = (raw[3] << 24) | (raw[4] << 16) | (raw[5] << 8) | raw[6]
                repeat_count = raw[7]
                images[image_id] = {
                    "total": total_frags,
                    "total_bytes": total_bytes,
                    "frags": {},
                    "seen_end": False,
                }
                print(
                    f"[RTS-START] img={image_id} frags={total_frags} "
                    f"bytes={total_bytes} repeat={repeat_count}"
                )
                continue

            if packet_type == PKT_TYPE_IMAGE_FRAGMENT:
                if len(raw) < 6:
                    continue
                image_id = raw[1]
                frag_idx = raw[2]
                total_frags = raw[3]
                payload_len = (raw[4] << 8) | raw[5]
                payload = raw[6 : 6 + payload_len]
                if len(payload) != payload_len:
                    continue

                if image_id not in images:
                    images[image_id] = {
                        "total": total_frags,
                        "total_bytes": 0,
                        "frags": {},
                        "seen_end": False,
                    }

                images[image_id]["total"] = total_frags
                images[image_id]["frags"][frag_idx] = payload
                print(f"[FRAG] img={image_id} {frag_idx + 1}/{total_frags} len={payload_len}")
                continue

            if packet_type == PKT_TYPE_IMAGE_END:
                if len(raw) < 3:
                    continue
                image_id = raw[1]
                total_frags = raw[2]
                if image_id not in images:
                    images[image_id] = {
                        "total": total_frags,
                        "total_bytes": 0,
                        "frags": {},
                        "seen_end": True,
                    }
                images[image_id]["total"] = total_frags
                images[image_id]["seen_end"] = True
                print(f"[RTS-END] img={image_id} frags={total_frags}")
                finalize_image(image_id)
                continue

            print(f"[UNK] tipo=0x{packet_type:02X} len={len(raw)}")


async def websocket_handler(websocket):
    connected_clients.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        connected_clients.discard(websocket)


async def broadcaster():
    while True:
        payload = await frontend_queue.get()
        if not connected_clients:
            continue
        message = json.dumps(payload)
        to_remove = set()
        for ws in connected_clients:
            try:
                await ws.send(message)
            except Exception:
                to_remove.add(ws)
        connected_clients.difference_update(to_remove)


async def main():
    global frontend_loop, frontend_queue
    frontend_loop = asyncio.get_running_loop()
    frontend_queue = asyncio.Queue()

    serial_thread = threading.Thread(target=serial_reader, daemon=True)
    serial_thread.start()

    async with websockets.serve(websocket_handler, WS_HOST, WS_PORT):
        print(f"Frontend WS listo en ws://{WS_HOST}:{WS_PORT}")
        await broadcaster()


if __name__ == "__main__":
    asyncio.run(main())
