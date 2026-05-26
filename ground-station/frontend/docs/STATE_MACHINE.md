# CanSat Finite State Machine (FSM)

The Finite State Machine (FSM) is responsible for tracking the current phase of the CanSat mission. It is implemented in the frontend (`lib/telemetry/stateMachine.ts`) and evaluates the telemetry payload in real-time as it arrives via the WebSocket.

## Data Sources

The FSM extracts the mission state by analyzing two key parameters from the incoming telemetry packets:
1. **`alt_ms5611` (Altitude):** Used to determine the absolute and relative height of the CanSat compared to its initial baseline altitude at launch.
2. **`velocity_z` (Vertical Velocity):** Used to determine if the CanSat is ascending (positive velocity), at apogee (near zero velocity), or descending (negative velocity).

## Mission States and Transitions

The mission follows a strict linear sequence of states. The FSM uses a "baseline altitude" recorded during the first few telemetry packets to calculate relative altitude changes (`altDiff`).

### 1. `PRE_LAUNCH` (Pre-lanzamiento)
- **Description:** The CanSat is resting on the ground or loaded into the launch vehicle waiting for liftoff.
- **Transition to `LIFT_ASCEND`:** 
  - Occurs when the relative altitude (`altDiff`) is strictly greater than a defined threshold (e.g., > 10cm).
  - To prevent false positives from sensor noise, this condition must be sustained for a minimum duration (`LIFT_MIN_DURATION_MS`).

### 2. `LIFT_ASCEND` (Ascenso)
- **Description:** The CanSat is rapidly ascending inside the rocket or drone.
- **Transition to `APOGEE`:**
  - The altitude reaches the expected apogee range (`APOGEE_MIN_ALTITUDE_M` to `APOGEE_MAX_ALTITUDE_M`).
  - The vertical velocity (`velocity_z`) drops close to `0 m/s` (absolute value < `1.0 m/s`), indicating it has reached the peak of its trajectory.

### 3. `APOGEE` (Apogeo)
- **Description:** The CanSat is at its maximum altitude and is about to start its descent.
- **Transition to `FREE_FALL`:**
  - Occurs when a distinct downward vertical velocity is detected (`velocity_z < -2.0 m/s`).

### 4. `FREE_FALL` (Caída Libre)
- **Description:** The CanSat is falling rapidly towards the ground before the primary recovery system (autogyro) is fully effective.
- **Transition to `AUTOGYRO_DEPLOYED`:**
  - The CanSat drops below a specific safe altitude threshold (`AUTOGYRO_DEPLOY_ALTITUDE_M`, e.g., 200m).

### 5. `AUTOGYRO_DEPLOYED` (Autogiro Desplegado)
- **Description:** The CanSat is descending steadily and safely using its autogyro recovery mechanism.
- **Transition to `LANDED`:**
  - The CanSat's relative altitude returns to near the baseline (`altDiff` is within the `LANDED_ALTITUDE_TOLERANCE_M`).
  - The vertical velocity settles near zero (`|velocity_z| < 0.5 m/s`).

### 6. `LANDED` (Aterrizado)
- **Description:** The CanSat has safely reached the ground.
- **Transition:** This is the final state. No further transitions occur.

## Debouncing Mechanism
To ensure sensor spikes or noise do not trigger false state transitions, the FSM implements a "debounce" mechanism. For critical transitions like launch detection, a timer (`liftConditionStartTime`) records when the threshold is first crossed. The transition is only confirmed if the condition remains true for the entire debounce window.
