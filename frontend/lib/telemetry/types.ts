export enum MissionState {
  PRE_LAUNCH = 'Pre-launch',
  LIFT_ASCEND = 'Lift / Ascend',
  APOGEE = 'Apogee',
  FREE_FALL = 'Free Fall',
  AUTOGYRO_DEPLOYED = 'Autogyro Deployed',
  LANDED = 'Landed / Ground',
}

export interface RawTelemetryPacket {
  timestamp_ms: number; // Unix timestamp or mission elapsed time in ms
  pres_ms5611: number; // Pa
  temp_bme280: number; // C
  hum_bme280: number; // %
  accel_x: number; // m/s^2
  accel_y: number; // m/s^2
  accel_z: number; // m/s^2
  gyro_x: number; // deg/s
  gyro_y: number; // deg/s
  gyro_z: number; // RPM or deg/s
  mag_x: number; // uT
  mag_y: number; // uT
  mag_z: number; // uT
  current_ina226: number; // A
  power_ina226: number; // W
  packets_received: number;
  
  // Computed / legacy fields used by GS logic
  alt_ms5611?: number; // Altitude meters
  velocity_z?: number; // m/s
}

export type ProcessedTelemetry = RawTelemetryPacket;

export interface StateMarker {
  time: number;
  state: MissionState;
}
