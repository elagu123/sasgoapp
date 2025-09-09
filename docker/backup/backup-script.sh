#!/bin/bash
# SASGOAPP Database Backup Script

set -e

# Configuration
BACKUP_DIR="/backups"
DB_HOST="postgres"
DB_NAME="${POSTGRES_DB:-sasgoapp}"
DB_USER="${POSTGRES_USER:-sasgouser}"
DB_PASSWORD="${POSTGRES_PASSWORD}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/sasgoapp_backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Backup database
log "Starting database backup..."

# Set password for pg_dump
export PGPASSWORD="${DB_PASSWORD}"

# Create backup
pg_dump -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} \
    --verbose \
    --no-password \
    --format=plain \
    --no-privileges \
    --no-tablespaces \
    --no-unlogged-table-data > ${BACKUP_FILE}

if [ $? -eq 0 ]; then
    log "Database backup created successfully: ${BACKUP_FILE}"
    
    # Compress backup
    gzip ${BACKUP_FILE}
    log "Backup compressed: ${COMPRESSED_FILE}"
    
    # Upload to S3 if configured
    if [ ! -z "${AWS_S3_BACKUP_BUCKET}" ] && [ ! -z "${AWS_ACCESS_KEY_ID}" ]; then
        log "Uploading backup to S3..."
        aws s3 cp ${COMPRESSED_FILE} s3://${AWS_S3_BACKUP_BUCKET}/database/$(basename ${COMPRESSED_FILE})
        if [ $? -eq 0 ]; then
            log "Backup uploaded to S3 successfully"
        else
            log "ERROR: Failed to upload backup to S3"
        fi
    fi
    
    # Clean up old backups (keep last 30 days)
    log "Cleaning up old backups..."
    find ${BACKUP_DIR} -name "sasgoapp_backup_*.sql.gz" -mtime +30 -delete
    
    # Clean up old S3 backups if configured
    if [ ! -z "${AWS_S3_BACKUP_BUCKET}" ] && [ ! -z "${AWS_ACCESS_KEY_ID}" ]; then
        THIRTY_DAYS_AGO=$(date -d '30 days ago' +%Y%m%d)
        aws s3 ls s3://${AWS_S3_BACKUP_BUCKET}/database/ | grep "sasgoapp_backup_" | while read -r line; do
            BACKUP_DATE=$(echo $line | grep -o '[0-9]\{8\}' | head -1)
            if [ ! -z "${BACKUP_DATE}" ] && [ "${BACKUP_DATE}" -lt "${THIRTY_DAYS_AGO}" ]; then
                FILE_NAME=$(echo $line | awk '{print $4}')
                aws s3 rm s3://${AWS_S3_BACKUP_BUCKET}/database/${FILE_NAME}
                log "Deleted old S3 backup: ${FILE_NAME}"
            fi
        done
    fi
    
    log "Backup completed successfully"
else
    log "ERROR: Database backup failed"
    exit 1
fi

# Unset password
unset PGPASSWORD

# Check backup file size
BACKUP_SIZE=$(du -h ${COMPRESSED_FILE} | cut -f1)
log "Backup size: ${BACKUP_SIZE}"

# Send notification if configured
if [ ! -z "${BACKUP_WEBHOOK_URL}" ]; then
    curl -X POST "${BACKUP_WEBHOOK_URL}" \
         -H "Content-Type: application/json" \
         -d "{\"text\":\"SASGOAPP backup completed successfully. Size: ${BACKUP_SIZE}\"}"
fi

log "Backup script finished"