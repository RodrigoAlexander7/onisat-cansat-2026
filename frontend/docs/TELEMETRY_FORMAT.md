# Telemetry Data Format

The frontend expects telemetry data to be delivered over a WebSocket connection (by default on `ws://localhost:8080`) as a continuous stream of JSON objects. Each JSON object represents a single telemetry packet and must conform to the following schema:

## Expected Fields

- `timestamp_ms` (number): Mission elapsed time in milliseconds.
- `pres_ms5611` (number): Atmospheric pressure in Pascals (Pa), from the MS5611 sensor.
- `temp_bme280` (number): Temperature in Celsius, from the BME280 sensor.
- `hum_bme280` (number): Relative humidity percentage, from the BME280 sensor.
- `accel_x` (number): Acceleration on the X-axis in m/s^2.
- `accel_y` (number): Acceleration on the Y-axis in m/s^2.
- `accel_z` (number): Acceleration on the Z-axis in m/s^2.
- `gyro_x` (number): Spin rate on the X-axis in degrees per second (dps).
- `gyro_y` (number): Spin rate on the Y-axis in degrees per second (dps).
- `gyro_z` (number): Spin rate on the Z-axis in degrees per second (dps).
- `mag_x` (number): Magnetic field on the X-axis in microteslas (uT).
- `mag_y` (number): Magnetic field on the Y-axis in microteslas (uT).
- `mag_z` (number): Magnetic field on the Z-axis in microteslas (uT).
- `current_ina226` (number): Current consumption in Amperes (A).
- `power_ina226` (number): Power consumption in Watts (W).
- `packets_received` (number): Sequential count of packets received.

*Note: `alt_ms5611` and `velocity_z` may also be computed and included depending on the logic configuration.*

## JSON Example

```json
{
  "timestamp_ms": 15200.5,
  "pres_ms5611": 101325.6,
  "temp_bme280": 24.3,
  "hum_bme280": 68.0,
  "accel_x": 0.04,
  "accel_y": -0.05,
  "accel_z": 9.81,
  "gyro_x": -0.02,
  "gyro_y": 0.03,
  "gyro_z": 0.01,
  "mag_x": 19.8,
  "mag_y": -5.1,
  "mag_z": -43.5,
  "current_ina226": 1.50,
  "power_ina226": 7.53,
  "packets_received": 152
}
```

The frontend maps these values to the corresponding time-series charts for real-time visualization. If a value is temporarily unavailable from the sensor, it is recommended to repeat the last known value to avoid gaps in the data extraction arrays.
