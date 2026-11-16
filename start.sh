#!/bin/sh
# Starts the game server (also serves the game). Needs Node.js 16+.
cd "$(dirname "$0")" && node server/server.js
