#!/usr/bin/env bash
# Para o hub do Any
pkill -f "anymous.*--port 4096" 2>/dev/null
pkill -f "any-interface/backend.*src/index.ts" 2>/dev/null
echo "hub parado"
