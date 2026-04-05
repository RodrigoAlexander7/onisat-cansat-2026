import { MissionState, ProcessedTelemetry } from './types';
import { TELEMETRY_CONSTANTS } from './constants';

export class CanSatStateMachine {
  private currentState: MissionState = MissionState.PRE_LAUNCH;
  private baselineAltitude: number | null = null;
  
  // Tracking for debounce
  private liftConditionStartTime: number | null = null;
  private dropConditionStartTime: number | null = null;

  public evaluate(packet: ProcessedTelemetry): MissionState {
    const currentAlt = (packet.alt_ms5611 + packet.alt_bme280) / 2; // Average altitude for logic
    
    // Set baseline if not set (first few packets)
    if (this.baselineAltitude === null) {
      this.baselineAltitude = currentAlt;
      return this.currentState;
    }

    const altDiff = currentAlt - this.baselineAltitude;

    switch (this.currentState) {
      case MissionState.PRE_LAUNCH:
        // Transition to LIFT_ASCEND: 
        // Altitude > 10cm and velocity roughly upwards/positive
        if (altDiff > (TELEMETRY_CONSTANTS.LIFT_MIN_ALTITUDE_CM / 100)) {
          if (!this.liftConditionStartTime) {
            this.liftConditionStartTime = packet.time;
          } else if (packet.time - this.liftConditionStartTime >= TELEMETRY_CONSTANTS.LIFT_MIN_DURATION_MS) {
            this.currentState = MissionState.LIFT_ASCEND;
            this.liftConditionStartTime = null; // reset
          }
        } else {
          // Reset if it drops back down before debounce
          this.liftConditionStartTime = null;
        }
        break;

      case MissionState.LIFT_ASCEND:
        // Handle short inconsistent drops during ascent: ignore drops < 1.5s
        if (packet.velocity_z < 0) {
           if (!this.dropConditionStartTime) {
             this.dropConditionStartTime = packet.time;
           } else if (packet.time - this.dropConditionStartTime >= 1500) {
             // Sustained drop, but is it apogee?
             // Only if we reached apogee height.
           }
        } else {
          this.dropConditionStartTime = null;
        }

        // Transition to APOGEE:
        // Altitude between 300 and 400m and velocity near zero
        if (
          currentAlt >= TELEMETRY_CONSTANTS.APOGEE_MIN_ALTITUDE_M && 
          currentAlt <= TELEMETRY_CONSTANTS.APOGEE_MAX_ALTITUDE_M &&
          Math.abs(packet.velocity_z) < 1.0 // near zero velocity
        ) {
          this.currentState = MissionState.APOGEE;
        }
        break;

      case MissionState.APOGEE:
        // Transition to FREE_FALL:
        if (packet.velocity_z < -2.0) { // Distinct downward velocity
          this.currentState = MissionState.FREE_FALL;
        }
        break;

      case MissionState.FREE_FALL:
        // Transition to AUTOGYRO_DEPLOYED:
        // Drops below 200m
        if (currentAlt <= TELEMETRY_CONSTANTS.AUTOGYRO_DEPLOY_ALTITUDE_M) {
          this.currentState = MissionState.AUTOGYRO_DEPLOYED;
        }
        break;

      case MissionState.AUTOGYRO_DEPLOYED:
        // Transition to LANDED:
        // Altitude within +- 1m of baseline
        if (Math.abs(altDiff) <= TELEMETRY_CONSTANTS.LANDED_ALTITUDE_TOLERANCE_M && Math.abs(packet.velocity_z) < 0.5) {
          this.currentState = MissionState.LANDED;
        }
        break;

      case MissionState.LANDED:
        // Final state, no transitions out.
        break;
    }

    return this.currentState;
  }
  
  public forceState(state: MissionState) {
    this.currentState = state;
  }

  public reset() {
    this.currentState = MissionState.PRE_LAUNCH;
    this.baselineAltitude = null;
    this.liftConditionStartTime = null;
    this.dropConditionStartTime = null;
  }
}
