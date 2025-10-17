#!/bin/bash

#############################################
# Pet Finder Log Monitor & Rotation Script
# Monitors logs for errors and implements rotation
#############################################

# Configuration
LOG_FILE="${LOG_FILE:-/var/log/petfinder.log}"
ALERT_FILE="${ALERT_FILE:-/var/log/petfinder-alerts.log}"
ERROR_THRESHOLD=5
TIME_WINDOW=60  # seconds
MAX_LOG_SIZE=$((10 * 1024 * 1024))  # 10MB
MAX_ROTATIONS=5
CHECK_INTERVAL=10  # Check every 10 seconds

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to print colored messages
log_message() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        ERROR)
            echo -e "${RED}[ERROR]${NC} [$timestamp] $message"
            ;;
        WARN)
            echo -e "${YELLOW}[WARN]${NC} [$timestamp] $message"
            ;;
        INFO)
            echo -e "${GREEN}[INFO]${NC} [$timestamp] $message"
            ;;
        *)
            echo "[$timestamp] $message"
            ;;
    esac
}

# Function to check if log file exists
check_log_file() {
    if [ ! -f "$LOG_FILE" ]; then
        log_message WARN "Log file $LOG_FILE does not exist. Creating it..."
        touch "$LOG_FILE" 2>/dev/null || {
            log_message ERROR "Cannot create log file $LOG_FILE. Check permissions."
            return 1
        }
    fi
    return 0
}

# Function to rotate logs
rotate_logs() {
    local log_file=$1
    local max_rotations=$2
    
    log_message INFO "Starting log rotation for $log_file"
    
    # Remove oldest rotation if exists
    if [ -f "${log_file}.${max_rotations}.gz" ]; then
        rm -f "${log_file}.${max_rotations}.gz"
        log_message INFO "Removed oldest rotation: ${log_file}.${max_rotations}.gz"
    fi
    
    # Rotate existing backups
    for ((i=$max_rotations-1; i>=1; i--)); do
        if [ -f "${log_file}.${i}.gz" ]; then
            mv "${log_file}.${i}.gz" "${log_file}.$((i+1)).gz"
        fi
    done
    
    # Compress and rotate current log
    if [ -f "$log_file" ] && [ -s "$log_file" ]; then
        cp "$log_file" "${log_file}.1"
        gzip -f "${log_file}.1"
        
        # Clear the original log file
        > "$log_file"
        
        log_message INFO "Log rotation completed. Created ${log_file}.1.gz"
    fi
}

# Function to check log size and rotate if needed
check_and_rotate() {
    local log_file=$1
    
    if [ -f "$log_file" ]; then
        local file_size=$(stat -f%z "$log_file" 2>/dev/null || stat -c%s "$log_file" 2>/dev/null)
        
        if [ "$file_size" -gt "$MAX_LOG_SIZE" ]; then
            log_message WARN "Log file size ($file_size bytes) exceeds threshold ($MAX_LOG_SIZE bytes)"
            rotate_logs "$log_file" "$MAX_ROTATIONS"
        fi
    fi
}

# Function to count errors in time window
count_errors() {
    local log_file=$1
    local time_window=$2
    local current_time=$(date +%s)
    local start_time=$((current_time - time_window))
    local error_count=0
    
    # Error patterns to search for
    local error_patterns=(
        "HTTP.*500"
        "Error:"
        "ERROR"
        "Exception"
        "FATAL"
        "failed"
    )
    
    # Count errors within time window
    while IFS= read -r line; do
        # Extract timestamp from log line (assuming format: YYYY-MM-DD HH:MM:SS)
        local log_timestamp=$(echo "$line" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}')
        
        if [ -n "$log_timestamp" ]; then
            local log_epoch=$(date -d "$log_timestamp" +%s 2>/dev/null || date -j -f "%Y-%m-%d %H:%M:%S" "$log_timestamp" +%s 2>/dev/null)
            
            if [ -n "$log_epoch" ] && [ "$log_epoch" -ge "$start_time" ]; then
                # Check if line contains error patterns
                for pattern in "${error_patterns[@]}"; do
                    if echo "$line" | grep -qi "$pattern"; then
                        ((error_count++))
                        break
                    fi
                done
            fi
        fi
    done < "$log_file"
    
    echo "$error_count"
}

# Function to trigger alert
trigger_alert() {
    local error_count=$1
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local alert_message="ALERT: Error threshold exceeded! Found $error_count errors in last $TIME_WINDOW seconds (threshold: $ERROR_THRESHOLD)"
    
    log_message ERROR "$alert_message"
    
    # Write to alert file
    echo "[$timestamp] $alert_message" >> "$ALERT_FILE"
    
    # Optional: Send email notification (uncomment if mail is configured)
    # echo "$alert_message" | mail -s "Pet Finder Alert: High Error Rate" admin@example.com
    
    # Optional: Trigger webhook (uncomment and configure)
    # curl -X POST -H 'Content-Type: application/json' \
    #      -d "{\"text\":\"$alert_message\"}" \
    #      https://hooks.slack.com/services/YOUR/WEBHOOK/URL
}

# Function to generate sample logs (for testing)
generate_sample_logs() {
    log_message INFO "Generating sample logs for testing..."
    
    for i in {1..3}; do
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: Pet search request received" >> "$LOG_FILE"
        sleep 1
    done
    
    for i in {1..6}; do
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: HTTP 500 - Database connection failed" >> "$LOG_FILE"
        sleep 0.5
    done
    
    log_message INFO "Sample logs generated"
}

# Function to display statistics
display_stats() {
    local log_file=$1
    local file_size=$(stat -f%z "$log_file" 2>/dev/null || stat -c%s "$log_file" 2>/dev/null || echo "0")
    local line_count=$(wc -l < "$log_file" 2>/dev/null || echo "0")
    local error_count=$(grep -ci "error\|exception\|fatal\|500" "$log_file" 2>/dev/null || echo "0")
    
    log_message INFO "=== Log Statistics ==="
    log_message INFO "File: $log_file"
    log_message INFO "Size: $(numfmt --to=iec-i --suffix=B $file_size 2>/dev/null || echo "${file_size} bytes")"
    log_message INFO "Lines: $line_count"
    log_message INFO "Total Errors: $error_count"
    log_message INFO "======================"
}

# Main monitoring loop
monitor_logs() {
    log_message INFO "Starting log monitoring..."
    log_message INFO "Log file: $LOG_FILE"
    log_message INFO "Alert file: $ALERT_FILE"
    log_message INFO "Error threshold: $ERROR_THRESHOLD errors in $TIME_WINDOW seconds"
    log_message INFO "Press Ctrl+C to stop"
    echo ""
    
    while true; do
        # Check if log file exists
        if ! check_log_file; then
            sleep "$CHECK_INTERVAL"
            continue
        fi
        
        # Check and rotate logs if needed
        check_and_rotate "$LOG_FILE"
        
        # Count errors in time window
        error_count=$(count_errors "$LOG_FILE" "$TIME_WINDOW")
        
        if [ "$error_count" -ge "$ERROR_THRESHOLD" ]; then
            trigger_alert "$error_count"
        else
            log_message INFO "Error count: $error_count (threshold: $ERROR_THRESHOLD)"
        fi
        
        # Display stats periodically
        if [ $((RANDOM % 6)) -eq 0 ]; then
            display_stats "$LOG_FILE"
        fi
        
        sleep "$CHECK_INTERVAL"
    done
}

# Main script
main() {
    case "${1:-monitor}" in
        monitor)
            monitor_logs
            ;;
        rotate)
            check_log_file && rotate_logs "$LOG_FILE" "$MAX_ROTATIONS"
            ;;
        test)
            check_log_file && generate_sample_logs
            ;;
        stats)
            check_log_file && display_stats "$LOG_FILE"
            ;;
        *)
            echo "Usage: $0 {monitor|rotate|test|stats}"
            echo ""
            echo "Commands:"
            echo "  monitor  - Start monitoring logs (default)"
            echo "  rotate   - Manually rotate logs"
            echo "  test     - Generate sample logs for testing"
            echo "  stats    - Display log statistics"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
