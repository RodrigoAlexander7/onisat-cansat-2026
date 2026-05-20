#!/usr/bin/env python3
import argparse
import os
from typing import Iterable

import matplotlib.pyplot as plt
import pandas as pd


def require_columns(df: pd.DataFrame, columns: Iterable[str]) -> None:
    missing = [col for col in columns if col not in df.columns]
    if missing:
        raise SystemExit(f"Faltan columnas en el CSV: {', '.join(missing)}")


def save_plot(x, y, xlabel: str, ylabel: str, title: str, out_path: str, show: bool) -> None:
    plt.figure(figsize=(8, 5))
    plt.plot(x, y, linewidth=1.2)
    plt.grid(True, alpha=0.3)
    plt.xlabel(xlabel)
    plt.ylabel(ylabel)
    plt.title(title)
    plt.tight_layout()
    plt.savefig(out_path, dpi=160)
    if show:
        plt.show()
    plt.close()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Genera graficas desde telemetry_log.csv (ground_estation)."
    )
    parser.add_argument(
        "--csv",
        default=os.path.join("received_images", "telemetry_log.csv"),
        help="Ruta al CSV de telemetria (default: received_images/telemetry_log.csv)",
    )
    parser.add_argument(
        "--out",
        default="plots",
        help="Directorio de salida para las imagenes PNG",
    )
    parser.add_argument(
        "--show",
        action="store_true",
        help="Muestra las graficas en pantalla ademas de guardarlas",
    )
    args = parser.parse_args()

    csv_path = args.csv
    if not os.path.isabs(csv_path):
        csv_path = os.path.join(os.getcwd(), csv_path)

    if not os.path.exists(csv_path):
        raise SystemExit(f"No se encontro el CSV: {csv_path}")

    df = pd.read_csv(csv_path)
    require_columns(
        df,
        [
            "timestamp_ms",
            "alt_ms5611",
            "pres_ms5611",
            "velocity_z",
            "accel_z",
            "packets_transmitted",
        ],
    )

    time_s = (df["timestamp_ms"] - df["timestamp_ms"].iloc[0]) / 1000.0
    altitude = df["alt_ms5611"]
    pressure = df["pres_ms5611"]
    velocity = df["velocity_z"]
    accel = df["accel_z"]
    packets_tx = df["packets_transmitted"]

    out_dir = args.out
    if not os.path.isabs(out_dir):
        out_dir = os.path.join(os.getcwd(), out_dir)
    os.makedirs(out_dir, exist_ok=True)

    save_plot(
        time_s,
        altitude,
        "Tiempo (s)",
        "Altura (m)",
        "Altura (m) vs Tiempo (s)",
        os.path.join(out_dir, "altura_vs_tiempo.png"),
        args.show,
    )
    save_plot(
        pressure,
        altitude,
        "Presion (Pa)",
        "Altura (m)",
        "Altura (m) vs Presion (Pa)",
        os.path.join(out_dir, "altura_vs_presion.png"),
        args.show,
    )
    save_plot(
        altitude,
        velocity,
        "Altura (m)",
        "Velocidad (m/s)",
        "Altura (m) vs Velocidad (m/s)",
        os.path.join(out_dir, "altura_vs_velocidad.png"),
        args.show,
    )
    save_plot(
        altitude,
        accel,
        "Altura (m)",
        "Aceleracion (m/s2)",
        "Altura (m) vs Aceleracion (m/s2)",
        os.path.join(out_dir, "altura_vs_aceleracion.png"),
        args.show,
    )
    save_plot(
        time_s,
        packets_tx,
        "Tiempo (s)",
        "Paquetes transmitidos (acumulado)",
        "Tiempo (s) vs Paquetes transmitidos (acumulado)",
        os.path.join(out_dir, "tiempo_vs_paquetes.png"),
        args.show,
    )

    print(f"Graficas guardadas en: {out_dir}")


if __name__ == "__main__":
    main()
