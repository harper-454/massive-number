#!/bin/bash
# Keep-alive wrapper for ws-service
cd /home/z/my-project/mini-services/ws-service
while true; do
  bun index.ts
  echo "ws-service exited, restarting in 2s..."
  sleep 2
done
