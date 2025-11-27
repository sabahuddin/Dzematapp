#!/bin/bash
set -e

# Start Express on port 3000 in background
echo "Starting Express on port $PORT..."
NODE_ENV=production node dist/index.js &
EXPRESS_PID=$!

# Wait for Express to be ready
sleep 2

# Start Caddy as reverse proxy
echo "Starting Caddy..."
caddy run --config /assets/Caddyfile --adapter caddyfile

# Keep Express running
wait $EXPRESS_PID
