#!/bin/bash
# SASGOAPP Production Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups"
LOG_DIR="./logs"

# Functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        warning "Running as root. Consider using a non-root user with docker permissions."
    fi
}

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    success "All dependencies are available"
}

# Check environment file
check_environment() {
    log "Checking environment configuration..."
    
    if [ ! -f "${ENV_FILE}" ]; then
        error "Production environment file ${ENV_FILE} not found. Please copy and configure .env.production"
    fi
    
    # Check for required variables
    required_vars=(
        "POSTGRES_PASSWORD"
        "JWT_ACCESS_SECRET"
        "JWT_REFRESH_SECRET"
        "REDIS_PASSWORD"
    )
    
    source "${ENV_FILE}"
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            error "Required environment variable ${var} is not set in ${ENV_FILE}"
        fi
    done
    
    success "Environment configuration is valid"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    mkdir -p "${BACKUP_DIR}"
    mkdir -p "${LOG_DIR}/nginx"
    mkdir -p "${LOG_DIR}/backend"
    mkdir -p "${LOG_DIR}/postgres"
    mkdir -p "docker/ssl"
    
    # Set proper permissions
    chmod 755 "${BACKUP_DIR}"
    chmod 755 "${LOG_DIR}"
    chmod +x docker/backup/backup-script.sh
    
    success "Directories created successfully"
}

# Pre-deployment backup
backup_current() {
    if docker-compose ps | grep -q "Up"; then
        log "Creating backup before deployment..."
        
        # Create application backup
        BACKUP_FILE="pre_deploy_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
        tar -czf "${BACKUP_DIR}/${BACKUP_FILE}" \
            --exclude=node_modules \
            --exclude=dist \
            --exclude=.git \
            --exclude="${BACKUP_DIR}" \
            --exclude="${LOG_DIR}" \
            .
        
        # Create database backup if database is running
        if docker-compose exec -T postgres pg_isready -U sasgouser -d sasgoapp &> /dev/null; then
            docker-compose exec -T postgres pg_dump -U sasgouser sasgoapp | gzip > "${BACKUP_DIR}/pre_deploy_db_$(date +%Y%m%d_%H%M%S).sql.gz"
            success "Database backup created"
        fi
        
        success "Pre-deployment backup created: ${BACKUP_FILE}"
    else
        log "No running containers found, skipping backup"
    fi
}

# Build and deploy
deploy() {
    log "Starting deployment..."
    
    # Pull latest images
    log "Pulling latest base images..."
    docker-compose pull --ignore-pull-failures
    
    # Build new images
    log "Building application images..."
    docker-compose build --no-cache
    
    # Stop current containers gracefully
    log "Stopping current containers..."
    docker-compose down --timeout 30
    
    # Start new containers
    log "Starting new containers..."
    docker-compose --env-file "${ENV_FILE}" up -d
    
    success "Containers started successfully"
}

# Run database migrations
run_migrations() {
    log "Waiting for database to be ready..."
    
    # Wait for database
    timeout 60 bash -c 'until docker-compose exec -T postgres pg_isready -U sasgouser -d sasgoapp; do sleep 2; done'
    
    if [ $? -eq 0 ]; then
        log "Running database migrations..."
        docker-compose exec -T backend npx prisma migrate deploy
        success "Database migrations completed"
    else
        error "Database is not ready after 60 seconds"
    fi
}

# Health check
health_check() {
    log "Performing health checks..."
    
    # Wait for services to start
    sleep 10
    
    # Check backend health
    if docker-compose exec -T backend wget --spider --timeout=10 http://localhost:3001/api/health &> /dev/null; then
        success "Backend is healthy"
    else
        error "Backend health check failed"
    fi
    
    # Check frontend
    if docker-compose exec -T frontend wget --spider --timeout=10 http://localhost/ &> /dev/null; then
        success "Frontend is healthy"
    else
        warning "Frontend health check failed - this might be normal during startup"
    fi
    
    # Check database
    if docker-compose exec -T postgres pg_isready -U sasgouser -d sasgoapp &> /dev/null; then
        success "Database is healthy"
    else
        error "Database health check failed"
    fi
    
    # Check Redis
    if docker-compose exec -T redis redis-cli ping &> /dev/null; then
        success "Redis is healthy"
    else
        warning "Redis health check failed"
    fi
}

# Clean up old images
cleanup() {
    log "Cleaning up unused Docker resources..."
    
    docker system prune -f
    docker image prune -f
    
    success "Cleanup completed"
}

# Display status
show_status() {
    log "Deployment Status:"
    echo
    docker-compose ps
    echo
    
    log "Service URLs:"
    echo "Frontend: http://localhost (or your configured domain)"
    echo "Backend API: http://localhost/api"
    echo "Health Check: http://localhost/api/health"
    
    if docker-compose ps | grep -q "grafana"; then
        echo "Monitoring: http://localhost:3000 (Grafana)"
    fi
    
    echo
    log "Logs can be viewed with:"
    echo "docker-compose logs -f [service-name]"
    echo
    log "To stop all services:"
    echo "docker-compose down"
}

# Print usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  --help              Show this help message"
    echo "  --no-backup         Skip pre-deployment backup"
    echo "  --no-migrations     Skip database migrations"
    echo "  --monitoring        Enable monitoring stack (Prometheus + Grafana)"
    echo "  --force             Force deployment without confirmations"
    echo
    echo "Examples:"
    echo "  $0                  # Normal deployment with backup and migrations"
    echo "  $0 --monitoring     # Deploy with monitoring stack"
    echo "  $0 --no-backup      # Deploy without backup"
    echo
}

# Main deployment function
main() {
    local skip_backup=false
    local skip_migrations=false
    local enable_monitoring=false
    local force=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help)
                usage
                exit 0
                ;;
            --no-backup)
                skip_backup=true
                shift
                ;;
            --no-migrations)
                skip_migrations=true
                shift
                ;;
            --monitoring)
                enable_monitoring=true
                shift
                ;;
            --force)
                force=true
                shift
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done
    
    # Add monitoring profile if requested
    if [ "$enable_monitoring" = true ]; then
        export COMPOSE_PROFILES=monitoring
    fi
    
    # Confirmation
    if [ "$force" = false ]; then
        echo -e "${YELLOW}This will deploy SASGOAPP to production.${NC}"
        echo -e "${YELLOW}Make sure you have configured ${ENV_FILE} properly.${NC}"
        echo
        read -p "Continue? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Deployment cancelled"
            exit 0
        fi
    fi
    
    # Execute deployment steps
    check_root
    check_dependencies
    check_environment
    create_directories
    
    if [ "$skip_backup" = false ]; then
        backup_current
    fi
    
    deploy
    
    if [ "$skip_migrations" = false ]; then
        run_migrations
    fi
    
    health_check
    cleanup
    show_status
    
    success "SASGOAPP deployed successfully!"
    
    log "Next steps:"
    echo "1. Configure your domain DNS to point to this server"
    echo "2. Set up SSL certificates (Let's Encrypt recommended)"
    echo "3. Configure monitoring and alerting"
    echo "4. Set up automated backups"
}

# Run main function
main "$@"