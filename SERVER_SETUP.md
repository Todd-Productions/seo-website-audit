# SEO Audit Server - Quick Setup Guide

This guide will help you get the SEO Audit Server up and running quickly.

## Prerequisites

1. **Node.js** - Version 18 or higher
2. **MongoDB** - Local or cloud instance
3. **pnpm** - Package manager (or npm/yarn)

## Installation Steps

### 1. Install MongoDB

#### Option A: Local MongoDB (Windows)

Download and install MongoDB Community Edition from:
https://www.mongodb.com/try/download/community

After installation, MongoDB should start automatically. You can verify it's running:

```powershell
# Check if MongoDB is running
Get-Service MongoDB

# Or connect to it
mongosh
```

#### Option B: MongoDB Atlas (Cloud)

1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
4. Update `.env` with your connection string

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and update if needed:
# - MONGODB_URI (if using Atlas or custom MongoDB)
# - SERVER_PORT (default: 3000)
# - JOB_RETENTION_HOURS (default: 24)
```

### 4. Build the Project

```bash
pnpm run build
```

### 5. Start the Server

```bash
# Production mode
pnpm run server

# Or development mode with auto-reload
pnpm run dev:server
```

You should see output like:

```
=== SEO Audit Server Starting ===
Connecting to MongoDB...
Connected to MongoDB successfully
Initializing WebSocket server...
WebSocket server initialized
Starting job queue processor...
Scheduling daily cleanup job...
Server running on port 3000
REST API: http://localhost:3000/api
WebSocket: ws://localhost:3000/ws/audit/:jobId
Health check: http://localhost:3000/api/health
```

## Verify Installation

### Test the Health Endpoint

```bash
# Using curl
curl http://localhost:3000/api/health

# Or open in browser
# http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T14:30:45.123Z"
}
```

### Submit a Test Audit

```bash
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "outputFormat": "by-page",
    "doLighthouse": false
  }'
```

Expected response:
```json
{
  "status": "queued",
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Audit job queued successfully"
}
```

### Check Job Status

```bash
# Replace JOB_ID with the jobId from the previous response
curl http://localhost:3000/api/audit/JOB_ID
```

## Troubleshooting

### MongoDB Connection Failed

**Error**: `Failed to connect to MongoDB`

**Solutions**:
1. Check if MongoDB is running: `Get-Service MongoDB` (Windows) or `systemctl status mongod` (Linux)
2. Verify connection string in `.env`
3. Check firewall settings
4. For Atlas: Ensure your IP is whitelisted

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solutions**:
1. Change `SERVER_PORT` in `.env` to a different port (e.g., 3001)
2. Or stop the process using port 3000:

```powershell
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill
```

### Build Errors

**Error**: TypeScript compilation errors

**Solutions**:
1. Ensure you're using Node.js 18+: `node --version`
2. Clean and reinstall dependencies:
   ```bash
   rm -rf node_modules dist
   pnpm install
   pnpm run build
   ```

### Jobs Not Processing

**Symptoms**: Jobs stuck in PENDING status

**Solutions**:
1. Check server logs for errors
2. Verify job queue is running (should see "Starting job queue processor" in logs)
3. Check MongoDB connection
4. Restart the server

## Next Steps

1. **Read the API Documentation**: See `SERVER_API_DOCUMENTATION.md` for complete API reference
2. **Test with WebSocket**: Try connecting to WebSocket for real-time updates
3. **Configure for Production**: Add authentication, HTTPS, rate limiting
4. **Monitor Logs**: Check `logs/` directory for audit logs

## Useful Commands

```bash
# Development with auto-reload
pnpm run dev:server

# Production build and run
pnpm run build
pnpm run server

# Run CLI audit (original functionality)
pnpm run audit

# Check MongoDB data
mongosh
> use seo-audit
> db.jobs.find()
```

## Default Configuration

| Setting | Default Value | Description |
|---------|--------------|-------------|
| SERVER_PORT | 3000 | HTTP server port |
| MONGODB_URI | mongodb://localhost:27017/seo-audit | MongoDB connection string |
| JOB_RETENTION_HOURS | 24 | How long to keep completed jobs |
| CRAWL_MAX_REQUESTS | 100 | Maximum pages to crawl per audit |
| CRAWL_MAX_CONCURRENCY | 3 | Concurrent crawl requests |

## Support

For more information:
- **API Documentation**: `SERVER_API_DOCUMENTATION.md`
- **Crawler Optimizations**: `CRAWLER_OPTIMIZATIONS.md`
- **Testing Guide**: `QUICK_TEST_GUIDE.md`

