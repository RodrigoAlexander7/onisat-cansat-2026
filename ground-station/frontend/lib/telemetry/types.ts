export enum MissionState {
  PRE_LAUNCH = 'Pre-launch',
  LIFT_ASCEND = 'Lift / Ascend',
  APOGEE = 'Apogee',
  FREE_FALL = 'Free Fall',
  AUTOGYRO_DEPLOYED = 'Autogyro Deployed',
  LANDED = 'Landed / Ground',
}

export interface RawTelemetryPacket {
  time: number; // Unix timestamp or mission elapsed time in ms
  alt_ms5611: number; // Altitude meters
  alt_bme280: number; // Altitude meters
  pressure: number; // hPa
  temperature: number; // C
  velocity_z: number; // m/s
  accel_x: number; // m/s^2
  accel_y: number; // m/s^2
  accel_z: number; // m/s^2
  gyro_z: number; // RPM or deg/s
  voltage: number; // V
  current: number; // mA
  packets_received: number;
}

export type ProcessedTelemetry = RawTelemetryPacket;

export interface StateMarker {
  time: number;
  state: MissionState;
}
