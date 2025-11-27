#!/bin/bash
set -e

# Create symlink for public folder (bundled code expects it in server/public)
mkdir -p dist/server
ln -sf ../public dist/server/public 2>/dev/null || true

# Start Express on PORT (3000 in production, set by Coolify)
PORT="${PORT:-3000}" NODE_ENV=production node dist/index.js
