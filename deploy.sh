#!/bin/bash
# Deployment script for Hetzner CAX11 (bridges-apps)
# Usage: ssh into server, then run this script
# Or run remotely: ssh root@178.104.60.171 'bash -s' < deploy.sh

set -e

APP_DIR="/opt/nonprofit-ai-radar"
REPO_URL="https://github.com/your-username/nonprofit-ai-radar.git"  # UPDATE THIS

echo "=== Nonprofit AI Radar — Hetzner Deployment ==="

# 1. Install Node.js 22 LTS (if not installed)
if ! command -v node &> /dev/null; then
  echo ">> Installing Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
echo "Node: $(node -v)"

# 2. Install PM2 globally (if not installed)
if ! command -v pm2 &> /dev/null; then
  echo ">> Installing PM2..."
  npm install -g pm2
fi

# 3. Install Nginx (if not installed)
if ! command -v nginx &> /dev/null; then
  echo ">> Installing Nginx..."
  apt-get update && apt-get install -y nginx
fi

# 4. Clone or pull the repo
if [ -d "$APP_DIR" ]; then
  echo ">> Pulling latest code..."
  cd "$APP_DIR"
  git pull
else
  echo ">> Cloning repository..."
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# 5. Create data directory for SQLite
mkdir -p "$APP_DIR/data"

# 6. Install dependencies & build
echo ">> Installing dependencies..."
npm ci --production=false

echo ">> Building..."
npm run build

# 7. Start/restart with PM2
echo ">> Starting app with PM2..."
pm2 delete nonprofit-ai-radar 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo ""
echo "=== App running on http://localhost:3000 ==="
echo "=== Set up Nginx reverse proxy next ==="
