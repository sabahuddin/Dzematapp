#!/bin/bash
set -e

# Start Express on PORT (3000 in production, set by Coolify)
PORT="${PORT:-3000}" NODE_ENV=production node dist/index.js
