## Sistema CanSat – Arquitectura y Operación

**Contexto general**  
- Concurso CanSat: el satélite sube en un dron hasta 400 m y luego cae en autogiro.  
- Solo computadora a bordo (Raspberry Pi Zero 2 W + LoRa SX1278 433 MHz).  
- La estación terrena ya está construida y lista para recibir datos.

**Resumen de la misión**
1. Durante el ascenso se deben tomar y transmitir 5 fotos (en hitos de altura).  
2. Al alcanzar 400 m se suelta el CanSat.  
3. A los 200 m de caída se activan dos servos (75° y 30°) para desplegar el autogiro.  
4. Al detectar el aterrizaje, el sistema transmite telemetría durante 30 s más y luego finaliza.

---

### 1. Arquitectura de software (tres capas independientes)

- **Capa de adquisición**  
  Bucle continuo desde el arranque hasta el final de la misión. Lee todos los sensores en orden fijo (MS5611 → BME280 → BMI160 + MC56x3 → INA226) y actualiza la altitud barométrica. La altitud del MS5611 es el dato crítico para las transiciones de estado.

- **Capa de estado (FSM)**  
  Cerebro del sistema. Consulta los últimos valores de la capa de adquisición y decide cambios de estado sin leer sensores directamente.

- **Capa de transmisión**  
  Gestiona autónomamente la cola de imágenes y el envío de paquetes de telemetría. Recibe órdenes de la FSM (activar cola, detenerla, cambiar frecuencia) pero mantiene su propio ritmo de transmisión.

---

### 2. Máquina de estados

**Inicialización**  
- Dura lo que tarden los sensores en iniciar y pasar auto-test.  
- Si un sensor falla, se registra el fallo y se continúa con los disponibles (la misión no se aborta).

**Reposo (en tierra)**  
- El sistema lee y descarta datos continuamente.  
- Mantiene una ventana de las últimas N lecturas de presión para calcular la altitud de referencia (base).  
- Transita a **Ascenso** cuando la altitud supera un umbral pequeño (ej. 3 m sobre la base) en al menos 3 lecturas consecutivas (filtro de falsas alarmas).

**Ascenso**  
- Estado más activo. Se monitorean dos condiciones en paralelo:  
  a) Hitos de altura para las fotos (10, 30, 50, 100 y 200 m).  
  b) Condiciones de salida: superar 300 m **o** detectar caída libre (lo que ocurra primero).  
- Al cruzar cada hito se dispara la cámara; la imagen se fragmenta y se encola.  
- La transmisión alterna 10 fragmentos de imagen por cada 1 paquete de telemetría.  
- Si se alcanza un nuevo hito y la foto anterior aún no se terminó de enviar, la nueva imagen se añade a la cola FIFO.

**Caída libre**  
- Se activa cuando la altitud supera los 300 m o se detecta caída libre.  
- La cola de imágenes se congela inmediatamente (los fragmentos pendientes se descartan).  
- La transmisión pasa a ser solo telemetría a 5 Hz.  
- Dentro de este estado, cuando la altitud desciende a 200 m se activan los servos (evento puntual, no un estado separado).  
- El sistema sigue verificando la altitud para detectar el aterrizaje.

**Aterrizaje**  
- Se detecta combinando un pico en el acelerómetro (impacto) y lecturas de altitud estables cerca de la altitud base.  
- Al entrar, se inicia un contador de 30 segundos. Durante ese tiempo se sigue transmitiendo telemetría a 5 Hz.  
- Al cumplirse el tiempo, se pasa a **Misión completa**.

**Misión completa**  
- Estado terminal. El sistema puede entrar en modo de bajo consumo o permanecer en espera silenciosa.

---

### 3. Datos de telemetría (payload optimizado)

| Código variable | Sensor | Ejemplo | Unidad | Tipo de codificación |
|-----------------|--------|---------|--------|----------------------|
| `timestamp_ms`  | Sistema (RTC) | 12045123 | ms | uint32 (milisegundos) |
| `pres_ms5611`   | MS5611 | 101325.6 | Pa | int32 (décimas de Pa → 1013256) |
| `temp_bme280`   | BME280 | 22.5 | °C | int16 (décimas de °C → 225) |
| `hum_bme280`    | BME280 | 68 | % | uint8 (entero) |
| `accel_x`       | BMI160 | 0.04 | m/s² | int16 (escalado 1 LSB = 0.001 m/s² → 40) |
| `accel_y`       | BMI160 | -0.05 | m/s² | int16 (-50) |
| `accel_z`       | BMI160 | 9.81 | m/s² | int16 (9810) |
| `gyro_x`        | BMI160 | -0.02 | °/s | int16 (1 LSB = 0.001 °/s → -20) |
| `gyro_y`        | BMI160 | 0.03 | °/s | int16 (30) |
| `gyro_z`        | BMI160 | 0.01 | °/s | int16 (10) |
| `mag_x`         | MC56x3 | 19.8 | µT | int16 (1 LSB = 0.1 µT → 198) |
| `mag_y`         | MC56x3 | -5.1 | µT | int16 (-51) |
| `mag_z`         | MC56x3 | -43.5 | µT | int16 (-435) |
| `current_ina226`| INA226 | 1.50 | A | uint16 (centésimas de A → 150) |
| `power_ina226`  | INA226 | 7.53 | W | uint16 (centésimas de W → 753) |

**Exclusiones justificadas**  
- `temp_ms5611`: valor interno, irrelevante para la misión.  
- `pres_bme280`: redundante (ya se tiene la presión del MS5611).

**Formato del paquete**  
- Cabecera: ID de misión, estado actual, contador de secuencia, CRC-8 (4–6 bytes).  
- Payload: ~30 bytes.  
- **Total por paquete: menos de 40 bytes**, apto para el SX1278.

---

### 4. Gestión de imágenes

- Cada foto se fragmenta en trozos del tamaño máximo del paquete LoRa.  
- Cada fragmento incluye: número de imagen, índice de fragmento, total de fragmentos, y datos.  
- Cola de transmisión FIFO: las fotos se encolan en el orden en que se tomaron.  
- Al entrar en **caída libre** (por altitud >300 m o detección de caída), se descarta toda la cola de imágenes y la transmisión pasa a ser solo telemetría. La estación terrena reconoce imágenes incompletas porque no llega el último fragmento.
- El payload que se usara sera de 100 bytes
- Se piensa usar la siguiente configuracion pero puede cambiar si existe una mas optima para el caso:
```
radio.begin(
  433.0,   // MHz
  250.0,   // kHz
  7,       // SF
  5,       // CR = 4/5
  0x12,    // sync word privado
  17,      // dBm
  8,       // preamble
  0        // AGC / gain auto
);
radio.setCRC(true);
```


---

### 5. Cálculo de altitud

- Se usa la fórmula barométrica estándar con la presión del MS5611.  
- La presión de referencia (base) se obtiene como promedio de las lecturas durante el estado **Reposo**.  
- La altitud es siempre relativa al punto de lanzamiento, independiente de la altura geográfica real o de la presión a nivel del mar.
