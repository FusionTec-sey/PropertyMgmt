# Docker Deployment Guide

This guide explains how to deploy your rental management app with both frontend and backend using Docker.

## 🚀 Quick Start

### 1. Create Environment File

Copy the example environment file and update with your values:

```bash
cp env.example .env
```

Edit `.env` and set:
- `POSTGRES_PASSWORD`: Strong password for PostgreSQL
- `EXPO_PUBLIC_API_URL`: Public URL where your app will be accessible

**Examples:**
- Local: `http://localhost:3000`
- VPS: `http://your-server-ip:3000`
- Domain: `https://yourdomain.com`

### 2. Build and Run

```bash
docker-compose up --build -d
```

This will:
- Build your React Native web frontend
- Start PostgreSQL database
- Start backend API with tRPC
- Serve everything on port 3000

### 3. Access Your App

- **Frontend (Web App)**: http://localhost:3000
- **Backend API**: http://localhost:3000/api/health
- **tRPC Endpoint**: http://localhost:3000/api/trpc

## 📦 What Gets Deployed

The Docker setup includes:

1. **Frontend**: React Native Web build served as static files
2. **Backend**: Hono server with tRPC API
3. **Database**: PostgreSQL 16 with persistent storage

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | PostgreSQL password | `mySecurePass123` |
| `DATABASE_URL` | Internal DB connection | Auto-configured |
| `EXPO_PUBLIC_API_URL` | Public API URL | `http://your-domain.com` |

### Port Configuration

Default port is `3000`. To change it:

1. Update `docker-compose.yml`:
   ```yaml
   ports:
     - "8080:3000"  # Maps external 8080 to internal 3000
   ```

2. Update `.env`:
   ```
   EXPO_PUBLIC_API_URL=http://your-domain.com:8080
   ```

## 🌐 Public Deployment

### Deploy on VPS (DigitalOcean, Linode, Hostinger, etc.)

1. **Install Docker** on your VPS:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo apt install docker-compose
   ```

2. **Clone/Upload your project** to VPS

3. **Create `.env` file** with your VPS IP or domain:
   ```bash
   EXPO_PUBLIC_API_URL=http://your-vps-ip:3000
   POSTGRES_PASSWORD=your_secure_password
   ```

4. **Run Docker Compose**:
   ```bash
   docker-compose up -d
   ```

5. **Access your app**:
   - Visit: `http://your-vps-ip:3000`

### Using a Domain Name

If you have a domain (e.g., `app.yourdomain.com`):

1. Point your domain to your VPS IP (A record in DNS)

2. Update `.env`:
   ```
   EXPO_PUBLIC_API_URL=https://app.yourdomain.com
   ```

3. Add nginx reverse proxy with SSL (recommended):

   **Install nginx and certbot:**
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx
   ```

   **Create nginx config** (`/etc/nginx/sites-available/rental-app`):
   ```nginx
   server {
       listen 80;
       server_name app.yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   **Enable site and get SSL:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/rental-app /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   sudo certbot --nginx -d app.yourdomain.com
   ```

## 🔄 Updates and Maintenance

### Update the App

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up --build -d
```

### View Logs

```bash
# All services
docker-compose logs -f

# Just the app
docker-compose logs -f app

# Just the database
docker-compose logs -f postgres
```

### Stop the App

```bash
docker-compose down
```

### Stop and Remove Data

```bash
docker-compose down -v  # Warning: This deletes database data!
```

## 🗄️ Database Management

### Backup Database

```bash
docker-compose exec postgres pg_dump -U postgres rental_management > backup.sql
```

### Restore Database

```bash
docker-compose exec -T postgres psql -U postgres rental_management < backup.sql
```

### Access PostgreSQL CLI

```bash
docker-compose exec postgres psql -U postgres rental_management
```

## 🐛 Troubleshooting

### Frontend Not Loading

1. Check if web build exists:
   ```bash
   docker-compose exec app ls -la /app/dist
   ```

2. Rebuild if needed:
   ```bash
   docker-compose up --build
   ```

### Database Connection Issues

1. Check database is healthy:
   ```bash
   docker-compose ps
   ```

2. Check logs:
   ```bash
   docker-compose logs postgres
   ```

### Port Already in Use

Change the external port in `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Use 8080 instead of 3000
```

## 📱 Mobile App Access

While the Docker deployment serves a web version, your React Native mobile apps can connect to the same backend:

1. **Development**: Update `EXPO_PUBLIC_API_URL` in your development environment
2. **Production**: Build mobile apps pointing to your production API URL

## 🔒 Security Recommendations

1. **Use strong passwords** for `POSTGRES_PASSWORD`
2. **Enable HTTPS** with SSL certificates (Let's Encrypt)
3. **Configure firewall**:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```
4. **Regular backups** of database
5. **Keep Docker images updated**:
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

## 📊 Monitoring

### Check Resource Usage

```bash
docker stats
```

### Check Disk Space

```bash
docker system df
```

### Clean Up Unused Resources

```bash
docker system prune -a
```

## ✅ Success Checklist

- [ ] Created `.env` file with proper configuration
- [ ] `EXPO_PUBLIC_API_URL` points to your public URL
- [ ] PostgreSQL password is secure
- [ ] Port 3000 is accessible (or your custom port)
- [ ] Frontend loads at your URL
- [ ] Backend API responds at `/api/health`
- [ ] Database is storing data (check after restart)
- [ ] SSL certificate configured (for production)
- [ ] Regular backups scheduled

---

Need help? Check the logs with `docker-compose logs -f app`
