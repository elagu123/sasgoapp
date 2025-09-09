# 🚀 SASGOAPP Deployment Guide

This guide covers deploying SASGOAPP to production environments, including cloud platforms, VPS servers, and containerized deployments.

## Production Requirements

### System Requirements
- **Node.js 18+** LTS version
- **Database**: PostgreSQL 14+ (production) or SQLite (development)
- **Memory**: Minimum 1GB RAM (2GB+ recommended)
- **Storage**: Minimum 10GB available space
- **SSL Certificate** for HTTPS

### Environment Preparation
- Domain name with DNS configuration
- SSL certificate (Let's Encrypt recommended)
- Database server (managed or self-hosted)
- File storage (local or cloud storage)

## Environment Variables

### Frontend Production Variables (.env.production)
```bash
# API Configuration
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_NODE_ENV=production

# AI Integration
VITE_GEMINI_API_KEY=your_production_gemini_key

# Google Services
REACT_APP_GOOGLE_MAPS_API_KEY=your_production_maps_key

# Analytics (Optional)
VITE_GA_TRACKING_ID=your_google_analytics_id
```

### Backend Production Variables (.env)
```bash
# Environment
NODE_ENV=production
PORT=3001

# Database - PostgreSQL Production
DATABASE_URL="postgresql://username:password@host:5432/sasgoapp?schema=public"

# Authentication - Generate new secure secrets
JWT_ACCESS_SECRET=your_super_secure_64_char_access_secret_for_production_env
JWT_REFRESH_SECRET=your_super_secure_64_char_refresh_secret_for_production_env

# CORS - Your production domain
CORS_ORIGIN=https://yourdomain.com

# Security
CSRF_SECRET=your_csrf_secret_32_chars_min

# External APIs
OPENWEATHER_API_KEY=your_weather_api_key
GOOGLE_MAPS_SERVER_API_KEY=your_server_side_maps_key

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn_for_error_tracking
LOG_LEVEL=info
```

## Cloud Platform Deployments

### 1. Vercel + Railway Deployment (Recommended)

#### Frontend on Vercel
1. **Connect Repository**
   ```bash
   # Push your code to GitHub
   git push origin main
   ```

2. **Vercel Configuration** (`vercel.json`)
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "dist"
         }
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/index.html"
       }
     ],
     "env": {
       "VITE_API_BASE_URL": "@api_base_url",
       "VITE_GEMINI_API_KEY": "@gemini_api_key"
     }
   }
   ```

3. **Deploy Steps**
   - Import project from GitHub to Vercel
   - Set environment variables in Vercel dashboard
   - Configure custom domain
   - Deploy automatically on git push

#### Backend on Railway
1. **Railway Configuration** (`railway.toml`)
   ```toml
   [build]
   builder = "nixpacks"
   buildCommand = "cd backend && npm run build"
   
   [deploy]
   startCommand = "cd backend && npm start"
   
   [env]
   NODE_ENV = "production"
   ```

2. **Deploy Steps**
   - Connect GitHub repository to Railway
   - Add PostgreSQL database service
   - Set environment variables
   - Configure custom domain
   - Deploy automatically

### 2. Netlify + Heroku Deployment

#### Frontend on Netlify
1. **Build Configuration** (`netlify.toml`)
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [build.environment]
     NODE_VERSION = "18"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy Steps**
   - Connect repository to Netlify
   - Configure build settings
   - Set environment variables
   - Configure custom domain with SSL

#### Backend on Heroku
1. **Heroku Configuration** (`Procfile`)
   ```
   web: cd backend && npm start
   ```

2. **Package.json Updates**
   ```json
   {
     "scripts": {
       "heroku-postbuild": "cd backend && npm install && npm run build"
     }
   }
   ```

3. **Deploy Steps**
   ```bash
   # Install Heroku CLI and login
   heroku login
   
   # Create application
   heroku create your-app-name
   
   # Add PostgreSQL
   heroku addons:create heroku-postgresql:hobby-dev
   
   # Set environment variables
   heroku config:set NODE_ENV=production
   heroku config:set JWT_ACCESS_SECRET=your_secret
   
   # Deploy
   git push heroku main
   ```

### 3. AWS Deployment

#### Frontend on S3 + CloudFront
```bash
# Build for production
npm run build

# Sync to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

#### Backend on EC2 + RDS
1. **EC2 Setup**
   ```bash
   # Connect to EC2 instance
   ssh -i your-key.pem ec2-user@your-ec2-ip
   
   # Install Node.js 18
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs
   
   # Install PM2 for process management
   sudo npm install -g pm2
   ```

2. **Application Setup**
   ```bash
   # Clone repository
   git clone https://github.com/your-username/sasgoapp.git
   cd sasgoapp
   
   # Install dependencies
   npm install
   cd backend && npm install
   
   # Set up environment
   cp .env.example .env
   # Edit .env with production values
   
   # Run database migrations
   npm run db:migrate
   
   # Start with PM2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

## Docker Deployment

### 1. Multi-Container Setup

#### Frontend Dockerfile
```dockerfile
# Frontend Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Backend Dockerfile
```dockerfile
# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app/backend

# Install dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy source code
COPY backend/ ./

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

EXPOSE 3001

# Start application
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=http://backend:3001
    depends_on:
      - backend

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@postgres:5432/sasgoapp
      - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    depends_on:
      - postgres
    volumes:
      - uploads:/app/uploads

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=sasgoapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
  uploads:
```

### 2. Single Container with Docker Compose
```bash
# Deploy with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale backend=3

# Update deployment
docker-compose pull
docker-compose up -d
```

## VPS Deployment (Traditional)

### 1. Server Setup (Ubuntu/Debian)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Nginx
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install git
```

### 2. Database Setup
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE sasgoapp;
CREATE USER sasgouser WITH ENCRYPTED PASSWORD 'securepassword';
GRANT ALL PRIVILEGES ON DATABASE sasgoapp TO sasgouser;
\q
```

### 3. Application Deployment
```bash
# Clone repository
git clone https://github.com/your-username/sasgoapp.git /var/www/sasgoapp
cd /var/www/sasgoapp

# Set proper permissions
sudo chown -R www-data:www-data /var/www/sasgoapp

# Install dependencies
npm install
cd backend && npm install && cd ..

# Build frontend
npm run build

# Set up environment
cd backend
cp .env.example .env
# Edit .env with production values

# Run database migrations
npm run db:migrate

# Build backend
npm run build
```

### 4. PM2 Process Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'sasgoapp-backend',
    cwd: '/var/www/sasgoapp/backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/sasgoapp/error.log',
    out_file: '/var/log/sasgoapp/access.log',
    log_file: '/var/log/sasgoapp/app.log'
  }]
};
```

```bash
# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. Nginx Configuration
```nginx
# /etc/nginx/sites-available/sasgoapp
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend - Serve React app
    location / {
        root /var/www/sasgoapp/dist;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/sasgoapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Database Migration in Production

### 1. Pre-deployment Steps
```bash
# Backup current database
pg_dump -h your_host -U your_user -d sasgoapp > backup_$(date +%Y%m%d_%H%M%S).sql

# Test migrations on staging
cd backend
npm run db:migrate
```

### 2. Zero-downtime Deployment
```bash
# 1. Deploy new code without running migrations
git pull origin main
npm install
cd backend && npm install
npm run build

# 2. Run migrations
npm run db:migrate

# 3. Restart application
pm2 reload ecosystem.config.js

# 4. Verify deployment
curl -f https://yourdomain.com/api/health || echo "Health check failed"
```

## Monitoring & Logging

### 1. Application Monitoring
```javascript
// backend/src/middleware/monitoring.js
const monitor = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  });
  
  next();
};
```

### 2. Log Management
```bash
# PM2 logs
pm2 logs sasgoapp-backend
pm2 logs sasgoapp-backend --lines 1000

# Rotate logs
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### 3. Health Checks
```javascript
// backend/src/routes/health.js
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

## Performance Optimization

### 1. Frontend Optimizations
```bash
# Analyze bundle size
npm run build -- --analyze

# Optimize images
npm install -D vite-plugin-imagemin

# Enable compression
# Configure in nginx or use compression middleware
```

### 2. Backend Optimizations
```javascript
// Enable compression
const compression = require('compression');
app.use(compression());

// Optimize Prisma queries
const trips = await prisma.trip.findMany({
  select: { id: true, title: true }, // Select only needed fields
  where: { userId },
  take: 20, // Limit results
  skip: (page - 1) * 20 // Pagination
});
```

### 3. Database Optimizations
```sql
-- Create indexes for frequently queried fields
CREATE INDEX idx_trips_user_id ON Trip(userId);
CREATE INDEX idx_expenses_trip_id ON Expense(tripId);
CREATE INDEX idx_expenses_created_at ON Expense(createdAt);
```

## Backup & Disaster Recovery

### 1. Database Backups
```bash
#!/bin/bash
# backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="sasgoapp_backup_$DATE.sql"

pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_FILE
gzip $BACKUP_FILE

# Upload to S3 (optional)
aws s3 cp $BACKUP_FILE.gz s3://your-backup-bucket/database/

# Keep only last 30 days of backups
find /path/to/backups -name "sasgoapp_backup_*.sql.gz" -mtime +30 -delete
```

### 2. Application Backup
```bash
#!/bin/bash
# backup-app.sh
tar -czf sasgoapp_app_$(date +%Y%m%d).tar.gz /var/www/sasgoapp
aws s3 cp sasgoapp_app_$(date +%Y%m%d).tar.gz s3://your-backup-bucket/application/
```

### 3. Automated Backups
```bash
# Add to crontab
0 2 * * * /path/to/backup-db.sh
0 3 * * 0 /path/to/backup-app.sh
```

## Troubleshooting

### Common Production Issues

#### Application Won't Start
```bash
# Check logs
pm2 logs sasgoapp-backend
tail -f /var/log/nginx/error.log

# Check environment variables
pm2 env sasgoapp-backend

# Restart services
pm2 restart sasgoapp-backend
sudo systemctl restart nginx
```

#### Database Connection Issues
```bash
# Test database connection
cd backend
npx prisma db pull

# Check PostgreSQL status
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"
```

#### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -text -noout

# Renew certificate
sudo certbot renew
```

#### Memory Issues
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head -10

# Monitor PM2 processes
pm2 monit
```

## Security Checklist

### Production Security
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Environment variables secured
- [ ] Database access restricted to application only
- [ ] Regular security updates applied
- [ ] Backup and recovery procedures tested
- [ ] Monitoring and alerting configured
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] CORS configured for production domain only
- [ ] Security headers enabled

---

This deployment guide should help you successfully deploy SASGOAPP to production. For additional support, refer to the [development guide](./development.md) or contact agsasmoda@gmail.com.