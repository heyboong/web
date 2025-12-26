#!/bin/bash

# ScanVia Dashboard Management Script
# Usage: ./manage.sh [start|stop|restart|status|logs|monitor]

case "$1" in
    start)
        echo "Starting ScanVia Dashboard..."
        pm2 start server.js --name "scanvia-dashboard"
        echo "✅ Dashboard started successfully!"
        ;;
    stop)
        echo "Stopping ScanVia Dashboard..."
        pm2 stop scanvia-dashboard
        echo "✅ Dashboard stopped!"
        ;;
    restart)
        echo "Restarting ScanVia Dashboard..."
        pm2 restart scanvia-dashboard
        echo "✅ Dashboard restarted!"
        ;;
    status)
        echo "📊 ScanVia Dashboard Status:"
        pm2 status
        ;;
    logs)
        echo "📋 ScanVia Dashboard Logs:"
        pm2 logs scanvia-dashboard --lines 50
        ;;
    monitor)
        echo "🖥️  Opening PM2 Monitor..."
        pm2 monit
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|monitor}"
        echo ""
        echo "Commands:"
        echo "  start    - Start the dashboard server"
        echo "  stop     - Stop the dashboard server"
        echo "  restart  - Restart the dashboard server"
        echo "  status   - Show server status"
        echo "  logs     - Show server logs"
        echo "  monitor  - Open PM2 monitoring interface"
        exit 1
        ;;
esac