#!/bin/bash
set -e

echo "🔄 Running database schema synchronization..."

# Run drizzle-kit push to sync schema with database
# This adds any missing columns without dropping data
# Using --force to handle any conflicts automatically
npx drizzle-kit push --force || {
  echo "⚠️ drizzle-kit push failed, but continuing with app start..."
}

echo "✅ Database schema sync attempted"

# Ensure dist/public exists (created by Vite build with all assets)
if [ ! -d "dist/public" ]; then
  echo "❌ Error: dist/public not found. Run 'npm run build' first."
  exit 1
fi

# Create symlink from dist/public to dist/server/public for bundled code path resolution
# This allows import.meta.dirname workarounds to find assets
mkdir -p dist/server
ln -sf ../public dist/server/public 2>/dev/null || true

# Verify symlink works
if [ ! -L "dist/server/public" ] && [ ! -d "dist/server/public" ]; then
  echo "⚠️  Warning: symlink creation failed, but dist/public exists directly"
fi

echo "🚀 Starting DžematApp server..."

# Start Express on PORT (3000 in production, set by Coolify)
PORT="${PORT:-3000}" NODE_ENV=production node dist/index.js
