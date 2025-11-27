#!/bin/bash
set -e

# Start Express on port 5000 in background
echo "Starting Express on port 5000..."
PORT=5000 NODE_ENV=production node dist/index.js &
EXPRESS_PID=$!

# Wait for Express to be ready
sleep 3

# Create Caddyfile for reverse proxy if it doesn't exist
mkdir -p /tmp
cat > /tmp/Caddyfile << 'EOF'
:3000 {
  reverse_proxy localhost:5000
}
EOF

# Start Caddy as reverse proxy on port 3000
echo "Starting Caddy on port 3000..."
caddy run --config /tmp/Caddyfile --adapter caddyfile

# Keep Express running
wait $EXPRESS_PID
