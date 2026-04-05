import asyncio
import json
import time
import math
import random
import websockets

async def telemetry_loop(websocket):
    start_time = time.time() * 1000
    
    # State flags for simulation
    state = "PRE_LAUNCH"
    altitude = 0.0
    velocity = 0.0
    packets = 0
    
    while True:
        try:
            current_time = time.time() * 1000
            elapsed = current_time - start_time
            
            # Simulate mission profile
            if elapsed < 5000:
                state = "PRE_LAUNCH"
                altitude = random.uniform(-0.1, 0.1)
                velocity = random.uniform(-0.1, 0.1)
            elif elapsed < 15000:
                state = "LIFT_ASCEND"
                # Rocket acceleration
                velocity += 2.0  # +2m/s every cycle
                altitude += velocity * 0.1
            elif altitude < 350 and state == "LIFT_ASCEND":
                # Coasting to apogee
                velocity -= 0.98  # gravity
                altitude += velocity * 0.1
                if velocity <= 0:
                    state = "APOGEE"
            elif state == "APOGEE":
                state = "FREE_FALL"
            elif state == "FREE_FALL":
                velocity -= 0.98
                altitude += velocity * 0.1
                if altitude <= 200:
                    state = "AUTOGYRO_DEPLOYED"
                    velocity = -5.0 # terminal velocity with autogyro
            elif state == "AUTOGYRO_DEPLOYED":
                velocity = -5.0 + random.uniform(-0.5, 0.5)
                altitude += velocity * 0.1
                if altitude <= 0:
                    state = "LANDED"
                    altitude = 0.0
                    velocity = 0.0
            
            # Ensure altitude doesn't go extremely negative
            if altitude < 0 and state == "LANDED":
                altitude = 0
            
            packets += 1
            
            payload = {
                "time": current_time,
                "alt_ms5611": altitude + random.uniform(-0.5, 0.5),
                "alt_bme280": altitude + random.uniform(-0.5, 0.5),
                "pressure": 1013.25 - (altitude * 0.12) + random.uniform(-0.2, 0.2), # rough approx
                "temperature": 25.0 - (altitude * 0.0065) + random.uniform(-0.2, 0.2),
                "velocity_z": velocity + random.uniform(-0.1, 0.1),
                "accel_x": random.uniform(-0.5, 0.5),
                "accel_y": random.uniform(-0.5, 0.5),
                "accel_z": (velocity - (getattr(telemetry_loop, "last_vel", 0))) / 0.1 + 9.81 + random.uniform(-1, 1),
                "gyro_z": 300 if state == "AUTOGYRO_DEPLOYED" else random.uniform(-5, 5),
                "voltage": 8.4 - (elapsed / 60000) * 0.1, # slowly draining from 8.4v
                "current": 450 + random.uniform(-20, 20),
                "packets_received": packets
            }
            
            telemetry_loop.last_vel = velocity
            
            await websocket.send(json.dumps(payload))
            await asyncio.sleep(0.3) # 10Hz
            
        except websockets.exceptions.ConnectionClosed:
           break

async def main():
    async with websockets.serve(telemetry_loop, "localhost", 8080):
        print("Mock CanSat Telemetry running on ws://localhost:8080")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
