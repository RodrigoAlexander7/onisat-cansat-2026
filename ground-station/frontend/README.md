# Ground Station Frontend

Real-time telemetry dashboard for the CanSat mission.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** (strict)
- **Zustand** — state management
- **uPlot** — high-performance time-series charts
- **Three.js** + **@react-three/fiber** — 3D CanSat render
- **ahrs** — Madgwick attitude estimation
- **Tailwind CSS v4**

## Data Flow

```
backend (WebSocket ws://localhost:8080) → frontend → uPlot charts / Three.js / image gallery
```

## Pages

| Route | Description |
|---|---|
| `/` | Dashboard — 6 real-time charts (altitude/pressure, temperature, vertical velocity, acceleration, gyro spin, power/current), mission status, summary cards |
| `/render` | 3D view — real-time CanSat model rotation from AHRS, latest image, telemetry metrics |
| `/img` | Image gallery — received JPEG images with upscale toggle and modal viewer |

## Key Components

- `hooks/useTelemetry.ts` — WebSocket client with auto-reconnect, packet batching, state machine integration
- `store/telemetry-store.ts` — Zustand store: history (3000 points), connection status, mission state, image state
- `lib/telemetry/stateMachine.ts` — CanSat FSM (Pre-launch → Lift → Apogee → Free Fall → Autogyro Deploy → Landed)
- `components/dashboard/charts/UPlotWrapper.tsx` — reusable uPlot chart with X-axis sync and mission state markers

## Development

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # production build
pnpm lint       # ESLint
```

Requires the backend (`recv_images.py` or `mock_temp.py`) running on `ws://localhost:8080`.

## Configuration

| Environment Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8080/ws` | WebSocket server URL |
