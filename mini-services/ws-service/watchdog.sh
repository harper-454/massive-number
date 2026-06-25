#!/bin/bash
cd /home/z/my-project/mini-services/ws-service
while true; do
  bun index.ts 2>&1
  echo "[$(date)] ws-service exited, restarting in 2s..." >> /tmp/ws-watchdog.log
  sleep 2
done
