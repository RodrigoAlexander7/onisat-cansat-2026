import os

import serial

PORT = "/dev/ttyACM0"  # Ajusta según tu sistema
BAUD = 115200
OUT_DIR = "received_images"

PKT_TYPE_IMAGE_FRAGMENT = 0x01
PKT_TYPE_IMAGE_START = 0x10
PKT_TYPE_IMAGE_END = 0x11

os.makedirs(OUT_DIR, exist_ok=True)

# image_id -> {"total": int, "total_bytes": int, "frags": {idx: bytes}, "seen_end": bool}
images = {}


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
    _, packet_len_str, hexdata = parts
    try:
        packet_len = int(packet_len_str)
        raw = bytes.fromhex(hexdata)
    except ValueError:
        return None
    if packet_len != len(raw):
        return None
    return raw


with serial.Serial(PORT, BAUD, timeout=1) as ser:
    print(f"Escuchando {PORT}...")
    while True:
        line = ser.readline().decode(errors="ignore").strip()
        if not line:
            continue

        raw = parse_rts_line(line)
        if raw is None:
            print(line)
            continue

        if len(raw) < 1:
            continue

        packet_type = raw[0]

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
