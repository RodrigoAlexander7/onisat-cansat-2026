export const TELEMETRY_CONSTANTS = {
  // Configurable WS URL via env, fallback to localhost:8080/ws
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws',
  
  // Keep the last N points in memory to avoid crushing the browser over long missions
  MAX_HISTORY_LENGTH: 3000,
  
  // Transition thresholds
  LIFT_MIN_ALTITUDE_CM: 10,
  LIFT_MIN_DURATION_MS: 1500, // 1.5s debounce for ascend
  APOGEE_MIN_ALTITUDE_M: 300,
  APOGEE_MAX_ALTITUDE_M: 400,
  AUTOGYRO_DEPLOY_ALTITUDE_M: 200,
  LANDED_ALTITUDE_TOLERANCE_M: 1, // +- 1m
};
