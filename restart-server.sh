#!/bin/bash
# Manual server restart script for ShadowChess
# Usage: ./restart-server.sh [start|stop|restart|logs|status]

COMMAND=${1:-restart}

case "$COMMAND" in
  start)
    pm2 start ecosystem.config.js
    pm2 save
    echo "Server started."
    ;;
  stop)
    pm2 stop shadowchess-server
    echo "Server stopped."
    ;;
  restart)
    pm2 restart ecosystem.config.js
    echo "Server restarted."
    ;;
  logs)
    pm2 logs shadowchess-server --lines 50
    ;;
  status)
    pm2 show shadowchess-server
    ;;
  *)
    echo "Usage: $0 [start|stop|restart|logs|status]"
    exit 1
    ;;
esac
