#!/bin/bash

# PetFinder Application Monitoring Script
# Monitors logs for error messages and implements log rotation

# Configuration
LOG_FILE="/var/log/petfinder.log"
ALERT_LOG="/var/log/petfinder-alerts.log"
ERROR_THRESHOLD=5
MONITOR_INTERVAL=60  # seconds
LOG_MAX_SIZE=10485760  # 10MB
LOG_BACKUP_COUNT=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log messages
log_message() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$ALERT_LOG"
    echo -e "${GREEN}[$timestamp] [$level]${NC} $message"
}

# Function to check log file existence and create if needed
ensure_log_files() {
    if [[ ! -f "$LOG_FILE" ]]; then
        touch "$LOG_FILE" 2>/dev/null || {
            echo -e "${RED}Error: Cannot create log file $LOG_FILE${NC}"
            exit 1
        }
    fi

    if [[ ! -f "$ALERT_LOG" ]]; then
        touch "$ALERT_LOG" 2>/dev/null || {
            echo -e "${RED}Error: Cannot create alert log file $ALERT_LOG${NC}"
            exit 1
        }
    fi
}

# Function to rotate logs
rotate_logs() {
    local current_size=$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null || echo "0")

    if [[ $current_size -gt $LOG_MAX_SIZE ]]; then
        log_message "INFO" "Rotating log file (size: ${current_size} bytes)"

        # Create backup
        local backup_file="${LOG_FILE}.$(date +%Y%m%d_%H%M%S)"
        cp "$LOG_FILE" "$backup_file"

        # Compress old backup if it exists
        if [[ -f "${LOG_FILE}.old" ]]; then
            gzip "${LOG_FILE}.old" 2>/dev/null || true
        fi

        # Rotate backups
        mv "$backup_file" "${LOG_FILE}.old" 2>/dev/null || true

        # Clean up old backups (keep only LOG_BACKUP_COUNT)
        ls -t "${LOG_FILE}"*.gz 2>/dev/null | tail -n +$((LOG_BACKUP_COUNT + 1)) | xargs rm -f 2>/dev/null || true

        # Truncate current log
        : > "$LOG_FILE"

        log_message "INFO" "Log rotation completed"
    fi
}

# Function to monitor errors
monitor_errors() {
    local start_time=$(date +%s)
    local end_time=$((start_time + MONITOR_INTERVAL))

    # Count HTTP 500 errors in the last minute
    local error_count=$(grep -c "ERROR 500" "$LOG_FILE" 2>/dev/null || echo "0")

    # Also check for general error patterns
    local general_errors=$(grep -c -i "error\|exception\|failed" "$LOG_FILE" 2>/dev/null || echo "0")

    local total_errors=$((error_count + general_errors))

    if [[ $total_errors -gt $ERROR_THRESHOLD ]]; then
        log_message "ALERT" "High error rate detected! $total_errors errors in the last $MONITOR_INTERVAL seconds"
        log_message "ALERT" "HTTP 500 errors: $error_count, General errors: $general_errors"

        # Optional: Send email alert (uncomment and configure)
        # echo "PetFinder Alert: High error rate ($total_errors errors)" | mail -s "PetFinder Monitoring Alert" admin@example.com
    fi

    # Log monitoring status
    if [[ $total_errors -gt 0 ]]; then
        log_message "INFO" "Monitoring cycle completed. Errors detected: $total_errors"
    else
        log_message "INFO" "Monitoring cycle completed. No errors detected."
    fi
}

# Function to check service health
check_service_health() {
    # Check if backend service is running
    if curl -s http://localhost:8000/ > /dev/null 2>&1; then
        log_message "INFO" "Backend service is healthy"
    else
        log_message "WARNING" "Backend service appears to be down"
    fi

    # Check if frontend service is running
    if curl -s http://localhost:8080/ > /dev/null 2>&1; then
        log_message "INFO" "Frontend service is healthy"
    else
        log_message "WARNING" "Frontend service appears to be down"
    fi
}

# Function to display usage
usage() {
    echo "PetFinder Monitoring Script"
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -d, --daemon    Run in daemon mode (continuous monitoring)"
    echo "  -c, --check     Perform single health check"
    echo "  -r, --rotate    Force log rotation"
    echo "  -h, --help      Display this help message"
    echo ""
    echo "Configuration:"
    echo "  LOG_FILE: $LOG_FILE"
    echo "  ALERT_LOG: $ALERT_LOG"
    echo "  ERROR_THRESHOLD: $ERROR_THRESHOLD errors per $MONITOR_INTERVAL seconds"
    echo "  LOG_MAX_SIZE: $LOG_MAX_SIZE bytes"
}

# Main function
main() {
    ensure_log_files

    case "${1:-}" in
        -d|--daemon)
            log_message "INFO" "Starting PetFinder monitoring daemon"
            while true; do
                rotate_logs
                monitor_errors
                check_service_health
                sleep $MONITOR_INTERVAL
            done
            ;;
        -c|--check)
            log_message "INFO" "Performing single health check"
            check_service_health
            monitor_errors
            ;;
        -r|--rotate)
            log_message "INFO" "Forcing log rotation"
            rotate_logs
            ;;
        -h|--help|*)
            usage
            ;;
    esac
}

# Run main function with all arguments
main "$@"