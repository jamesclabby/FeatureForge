# FeatureForge Deployment Guide

## 🚀 Environment Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn
- Git

### 1. Environment Variables

Create the following environment files:

#### Server Environment (server/.env)

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=featureforge_prod
DB_USER=your_db_user
DB_PASSWORD=your_secure_password

# Database Pool Settings (Optional)
DB_POOL_MAX=20
DB_POOL_MIN=0
DB_POOL_ACQUIRE=60000
DB_POOL_IDLE=10000
DB_POOL_EVICT=1000

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_256_bits_minimum
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_SERVICE_ACCOUNT_KEY=./config/secure/firebase-service-account.json
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Server Configuration
PORT=5000
NODE_ENV=production
LOG_LEVEL=info

# Frontend URL for email links
FRONTEND_URL=https://your-domain.com

# CORS Origins (comma-separated)
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

#### Frontend Environment (featureforge/.env)

```bash
# API Configuration
REACT_APP_API_URL=https://api.your-domain.com/api

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Build Configuration
GENERATE_SOURCEMAP=false
REACT_APP_ENV=production
```

### 2. Database Setup

```bash
# Create database
createdb featureforge_prod

# Run migrations
cd server
npm run db:migrate

# Seed initial data (optional)
npm run db:seed:all
```

### 3. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication with Email/Password and Google providers
3. Generate a service account key:
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Save as `server/config/secure/firebase-service-account.json`
4. Set up Firestore rules and indexes if using Firestore

### 4. Email Setup (Gmail)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate password for "Mail"
3. Use this app password in EMAIL_PASSWORD environment variable

## 🛠️ Deployment Options

### Option 1: Traditional Server Deployment

```bash
# Install dependencies
npm run install:all

# Build frontend
cd featureforge
npm run build

# Start production server
cd ../server
npm start
```

### Option 2: PM2 Process Manager

```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem file
```

#### ecosystem.config.js
```javascript
module.exports = {
  apps: [{
    name: 'featureforge-api',
    script: './server/src/index.js',
    cwd: './',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

```bash
# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 3: Nginx Reverse Proxy

#### nginx.conf
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # Serve frontend static files
    location / {
        root /path/to/featureforge/build;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Proxy API requests
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔒 Security Checklist

- [ ] Use strong JWT secrets (256-bit minimum)
- [ ] Enable HTTPS in production
- [ ] Set secure Firebase rules
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting (already implemented)
- [ ] Set up proper CORS origins
- [ ] Use helmet.js security headers (already implemented)
- [ ] Enable database SSL in production
- [ ] Set up log rotation
- [ ] Configure firewall rules

## 📊 Monitoring

### Health Check

The application provides a health check endpoint at `/api/health` that returns:

```json
{
  "success": true,
  "data": {
    "uptime": 12345,
    "message": "OK",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "environment": "production",
    "version": "1.0.0",
    "database": "connected",
    "memory": {
      "rss": "50 MB",
      "heapTotal": "30 MB",
      "heapUsed": "25 MB",
      "external": "5 MB"
    }
  }
}
```

### Log Files

Logs are written to:
- `server/logs/error.log` - Error logs only
- `server/logs/combined.log` - All logs
- Console output in development

### Performance Monitoring

The frontend includes Web Vitals tracking. Enable with:
```bash
REACT_APP_ENABLE_PERFORMANCE_MONITORING=true
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL or individual DB_* variables
   - Ensure PostgreSQL is running
   - Verify network connectivity

2. **Firebase Authentication Errors**
   - Verify service account key path
   - Check Firebase project configuration
   - Ensure proper IAM permissions

3. **Email Sending Fails**
   - Check email credentials
   - Verify app password for Gmail
   - Test with a simple SMTP client

4. **Frontend Build Errors**
   - Clear node_modules and package-lock.json
   - Reinstall dependencies
   - Check for version conflicts

### Performance Optimization

1. **Database**
   - Add indexes for frequently queried columns
   - Use connection pooling (already configured)
   - Monitor slow queries

2. **Frontend**
   - Enable gzip compression
   - Use CDN for static assets
   - Implement code splitting
   - Use service workers for caching

3. **API**
   - Implement response caching
   - Use database query optimization
   - Monitor API response times

## 📈 Scaling Considerations

- **Horizontal Scaling**: Use PM2 cluster mode or container orchestration
- **Database**: Consider read replicas for high read loads
- **Caching**: Implement Redis for session storage and API caching
- **CDN**: Use CDN for static asset delivery
- **Load Balancing**: Use nginx or cloud load balancers

## 🔄 Updates and Maintenance

```bash
# Update dependencies
npm run install:all

# Run database migrations
cd server && npm run db:migrate

# Build and restart
npm run build
pm2 restart featureforge-api
```

## 📞 Support

For deployment issues:
1. Check application logs
2. Verify environment configuration
3. Test individual components
4. Review this documentation 