#!/bin/bash
# Warmup script: Pre-compiles all routes before browser testing
# Run this after starting the dev server and BEFORE opening Chrome

echo "🔥 Warming up all routes..."

# Wait for server to be ready
for i in $(seq 1 30); do
  if curl -s -o /dev/null --max-time 2 http://localhost:3000/ 2>/dev/null; then
    echo "✅ Server is ready"
    break
  fi
  sleep 1
done

# Compile the main page
echo "📄 Compiling page..."
curl -s -o /dev/null --max-time 15 http://localhost:3000/
sleep 2

# Compile all API routes sequentially
echo "🔧 Compiling API routes..."
for route in \
  account dev-surfaces history library chat-folders project-templates \
  models chat settings personas rules specs activity notifications \
  snippets providers mcp; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "http://localhost:3000/api/${route}" 2>/dev/null)
  echo "  $CODE /api/$route"
  sleep 1
done

echo "✅ All routes compiled! Safe to open Chrome."
