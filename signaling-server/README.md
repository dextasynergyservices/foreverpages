Signaling server for ForeverPages — minimal Socket.io TypeScript service

Quick start (local dev)

1. Copy `.env.example` to `.env` and fill values.
2. Install deps and run in dev mode:

```pwsh
cd signaling-server
pnpm install
pnpm dev
```

Build & run (production)

```pwsh
cd signaling-server
pnpm build
docker build -t foreverpages-signaling .
docker run -p 3001:3000 -e PORT=3000 -e NODE_ENV=production foreverpages-signaling
```

Railway deployment notes

- In Railway create a new service and set the "Root Directory" to `signaling-server`.
- Ensure the service has the following environment variables set in Railway:
  - `JWT_SECRET` (required)
  - `REDIS_URL` (optional)
  - `TURN_URL`, `TURN_USERNAME`, `TURN_PASSWORD` (if using TURN)
  - `NODE_ENV=production`

The service exposes `/api/health` and the Socket.io endpoint is available at `/api/socket`.
