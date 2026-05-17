## 6. Estructura del proyecto C++

Todo el código se escribe en C++. Se organiza en módulos bien definidos para que las siguientes fases (FSM, control, sensores adicionales) se añadan sin tocar lo ya probado.

```
cansat/
├── CMakeLists.txt                # Build del proyecto
├── config.h                      # Constantes compartidas (LoRa, altitud, paquetes)
├── src/                          # Proceso principal C++
│   ├── main.cpp
│   ├── comms/
│   │   ├── lora.cpp / lora.h     # Driver SX1278
│   │   └── packet.cpp / packet.h # Construcción de fragmentos de imagen y telemetría
│   ├── imaging/
│   │   ├── camera.cpp / camera.h # Captura con libcamera
│   │   └── queue.cpp / queue.h   # Cola FIFO de fragmentos
│   ├── control/
│   │   └── servos.cpp / servos.h # (siguiente fase)
│   └── fsm/
│       ├── states.cpp / states.h # (siguiente fase)
│       └── machine.cpp / machine.h# (siguiente fase)
├── sensors/                      # Módulos de adquisición (clases C++)
│   ├── altimeter.cpp / altimeter.h   # MS5611 (presión y altitud)
│   ├── environment.cpp / .h          # BME280 (temperatura, humedad)
│   ├── imu.cpp / .h                  # BMI160 (acelerómetro, giroscopio)
│   ├── magnetometer.cpp / .h         # MC56x3 (magnetómetro)
│   └── power.cpp / .h                # INA226 (corriente, potencia)
├── tests/
│   ├── test_lora.cpp
│   ├── test_packet.cpp
│   └── test_sensors.cpp
├── tmp/                          # Solo para depuración manual
└── logs/
```

---

## 7. Responsabilidades de cada módulo (en C++)

### `config.h`
Centraliza **todas** las constantes configurables:
- Frecuencia y spreading factor del LoRa.
- Resolución y calidad JPEG de la cámara.
- Tamaño máximo de payload por paquete LoRa.
- Altitudes de disparo de foto.
- Tamaño de la ventana de presión para calcular la referencia base.
Ningún otro archivo contiene «números mágicos».

### `comms/lora.cpp` (y su `.h`)
Encapsula el SX1278 tras una interfaz mínima:
- `init()`
- `send_packet(const std::vector<uint8_t>& data)`  
El resto del sistema nunca habla directamente con el hardware LoRa. Cuando se añada la FSM, ningún estado necesitará saber qué transmisor concreto se usa.

### `comms/packet.cpp`
Ahora expone:
- `build_image_fragment(uint8_t img_id, uint8_t frag_index, uint8_t total_frags, const std::vector<uint8_t>& data) → std::vector<uint8_t>`
- Cuando llegue la telemetría se añadirá `build_telemetry(const SensorData& data) → std::vector<uint8_t>` en el mismo archivo, sin modificar lo existente.
El formato binario del fragmento de imagen ya está definido con un header fijo:
  - Tipo de paquete (1 B)
  - ID de imagen (1 B)
  - Índice de fragmento (1 B)
  - Total fragmentos (1 B)
  - Longitud del payload (2 B)
  - Datos

### `imaging/camera.cpp`
Expone una función `capture() → std::vector<uint8_t>` que:
- Captura la foto.
- La comprime a JPEG con la calidad definida en `config.h`.
- Devuelve los bytes (sin guardar en disco en el flujo normal, `tmp/` es solo para depuración).

### `imaging/queue.cpp`
Administra la cola de fragmentos de imagen. Interfaz:
- `enqueue_image(const std::vector<uint8_t>& jpeg_bytes)`
- `bool has_pending() const`
- `std::optional<std::vector<uint8_t>> pop_fragment()`
Cuando la FSM esté activa, se añadirá un método `stop()` que vacíe la cola o haga que `has_pending()` devuelva siempre `false`.

### `sensors/altimeter.cpp`
Módulo del sensor de presión MS5611. Interfaz:
- `init()`
- `float read_pressure()`
- `float get_altitude(float ref_pressure)`
Es el único sensor necesario en la primera fase. `main.cpp` usará un promedio inicial de `read_pressure()` como referencia y luego calculará altitud relativa en cada ciclo.

### `main.cpp` (fase actual)
Es deliberadamente simple:
1. Inicializa altímetro, cámara, LoRa y cola.
2. Bucle principal: monitorea la altitud, dispara fotos en los hitos configurados y consume la cola para enviar fragmentos.
Cuando la FSM esté implementada, `main.cpp` se reducirá a crear la máquina de estados y ejecutarla.

### Otros módulos futuros
- `sensors/environment.cpp`, `imu.cpp`, `magnetometer.cpp`, `power.cpp`: se añadirán en fases posteriores sin tocar el altímetro.
- `control/servos.cpp`: activación de servos en el estado de caída libre.
- `fsm/`: implementación de la máquina de estados; importará los módulos ya existentes (`altimeter`, `camera`, `queue`, `lora`, `servos`) como dependencias con interfaces limpias.

---

## 8. Por qué esta estructura facilita las siguientes fases

- El directorio `sensors/` crece de 1 a 5 archivos sin modificar el código ya probado.
- `control/` y `fsm/` son directorios nuevos que no interfieren con nada existente.
- `comms/packet.cpp` se extiende añadiendo funciones (como `build_telemetry()`), sin tocar las que ya funcionan.
- La FSM, cuando llegue, solo tendrá que usar las interfaces ya definidas de los módulos, gracias a la separación de responsabilidades desde el inicio.
