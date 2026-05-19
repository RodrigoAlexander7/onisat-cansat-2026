'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import AHRS from 'ahrs';
import { ProcessedTelemetry } from '@/lib/telemetry/types';

interface Quaternion { x: number; y: number; z: number; w: number }

// ─── Attitude estimator ────────────────────────────────────────────────────────
// Madgwick runs ONLY when a new packet arrives, not every animation frame.
// This prevents integrating stale gyro readings 6× per sensor cycle.

function useAttitude(packet: ProcessedTelemetry | null): THREE.Quaternion {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const madgwickRef = useRef<any>(
    new AHRS({ sampleInterval: 100, algorithm: 'Madgwick', beta: 0.15 })
  );
  // Quaternion lives in state — safe to read during render
  const [attitude, setAttitude] = useState<THREE.Quaternion>(
    () => new THREE.Quaternion()
  );
  const prevTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (!packet) return;
    if (packet.timestamp_ms === prevTimestampRef.current) return;
    prevTimestampRef.current = packet.timestamp_ms;

    const DEG = Math.PI / 180;
    const gx = (packet.gyro_x ?? 0) * DEG;
    const gy = (packet.gyro_y ?? 0) * DEG;
    const gz = (packet.gyro_z ?? 0) * DEG;
    const ax = packet.accel_x ?? 0;
    const ay = packet.accel_y ?? 0;
    const az = packet.accel_z ?? 0;
    const mx = packet.mag_x ?? 0;
    const my = packet.mag_y ?? 0;
    const mz = packet.mag_z ?? 0;

    madgwickRef.current.update(gx, gy, gz, ax, ay, az, mx, my, mz);
    const q: Quaternion = madgwickRef.current.getQuaternion();
    if (q) {
      // Create a new instance so React detects the state change
      setAttitude(new THREE.Quaternion(q.x, q.y, q.z, q.w));
    }
  }, [packet]);

  return attitude;
}

// ─── 3-D geometry ─────────────────────────────────────────────────────────────
function CanSatGeometry({ attitude }: { attitude: THREE.Quaternion }) {
  const groupRef = useRef<THREE.Group>(null);

  // Smoothly slerp to the target quaternion every animation frame
  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.quaternion.slerp(attitude, 0.1);
  });

  return (
    <group ref={groupRef}>
      {/* Transparent core body — proportions 10×10×20 cm */}
      <mesh>
        <boxGeometry args={[0.85, 1.85, 0.85]} />
        <meshLambertMaterial color="#e2e8f0" transparent opacity={0.75} />
      </mesh>

      {/* Blue structural rails — 4 vertical faces */}
      <mesh position={[0.48, 0, 0]}>
        <boxGeometry args={[0.08, 1.9, 0.85]} />
        <meshLambertMaterial color="#2563eb" />
      </mesh>
      <mesh position={[-0.48, 0, 0]}>
        <boxGeometry args={[0.08, 1.9, 0.85]} />
        <meshLambertMaterial color="#2563eb" />
      </mesh>
      <mesh position={[0, 0, 0.48]}>
        <boxGeometry args={[0.85, 1.9, 0.08]} />
        <meshLambertMaterial color="#1d4ed8" />
      </mesh>
      <mesh position={[0, 0, -0.48]}>
        <boxGeometry args={[0.85, 1.9, 0.08]} />
        <meshLambertMaterial color="#1d4ed8" />
      </mesh>

      {/* Bottom cap */}
      <mesh position={[0, -0.97, 0]}>
        <boxGeometry args={[0.95, 0.06, 0.95]} />
        <meshLambertMaterial color="#1e40af" />
      </mesh>

      {/* Top cap */}
      <mesh position={[0, 0.97, 0]}>
        <boxGeometry args={[0.95, 0.06, 0.95]} />
        <meshLambertMaterial color="#1e40af" />
      </mesh>

      {/* Red antenna knob */}
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.1, 12]} />
        <meshLambertMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}

// ─── Scene wrapper ─────────────────────────────────────────────────────────────
function Scene({ packet }: { packet: ProcessedTelemetry | null }) {
  const attitude = useAttitude(packet);
  return <CanSatGeometry attitude={attitude} />;
}

// ─── Public export ─────────────────────────────────────────────────────────────
export function CanSatModel({ packet }: { packet: ProcessedTelemetry | null }) {
  const [contextLost, setContextLost] = useState(false);

  const handleCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    const canvas = gl.domElement;
    canvas.addEventListener('webglcontextlost', () => setContextLost(true));
    canvas.addEventListener('webglcontextrestored', () => setContextLost(false));
  }, []);

  if (contextLost) {
    return (
      <div className="flex w-full h-full items-center justify-center text-orange-500 font-semibold text-sm p-4 text-center">
        GPU context lost — try refreshing or using a different browser.
      </div>
    );
  }

  return (
    <Canvas
      camera={{ position: [2.5, 3.5, 3.5], fov: 45 }}
      gl={{
        antialias: false,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
      }}
      onCreated={handleCreated}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[4, 8, 4]} intensity={1.0} />
      <directionalLight position={[-4, -4, -4]} intensity={0.3} />
      <Scene packet={packet} />
      <OrbitControls enableZoom={true} enablePan={false} />
    </Canvas>
  );
}
