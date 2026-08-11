#!/usr/bin/env bash
# Deploy bản mới trên VPS: pull -> build image -> migrate -> restart app.
# Postgres là bản cài sẵn trên host, không nằm trong compose.
# Chạy từ bất kỳ đâu: ./deploy/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "Thiếu .env — copy từ .env.example rồi điền trước khi deploy." >&2
  exit 1
fi

if grep -qE '^DATABASE_URL=.*@(localhost|127\.0\.0\.1):' .env; then
  echo "DATABASE_URL đang trỏ vào localhost — trong container đó là chính nó." >&2
  echo "Đổi host thành host.docker.internal rồi chạy lại." >&2
  exit 1
fi

echo "==> git pull"
git pull --ff-only

# `up` sẽ tự chạy service migrate (prisma migrate deploy) trước khi start app.
echo "==> docker compose up --build"
docker compose up -d --build

echo "==> chờ app healthy"
docker compose ps
docker compose logs --tail=30 app
