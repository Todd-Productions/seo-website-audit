# Getting Started with SEO Audit Server

This guide will help you get started with the SEO Audit Server in just a few minutes.

## Prerequisites

Before you begin, make sure you have:

1. **Node.js 18+** installed
2. **MongoDB** installed locally OR a MongoDB Atlas account
3. **pnpm** installed (or npm/yarn)

## Step 1: Install MongoDB

### Option A: Local MongoDB (Recommended for Development)

**Windows:**
1. Download MongoDB Community Edition: https://www.mongodb.com/try/download/community
2. Run the installer
3. MongoDB will start automatically as a Windows service

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install mongodb

# Start MongoDB
sudo systemctl start mongod
```

### Option B: MongoDB Atlas (Cloud)

1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free tier available)
3. Get your connection string
4. Update `.env` with your connection string

## Step 2: Clone and Install

```bash
# Navigate to project directory
cd seo-website-audit

# Install dependencies
pnpm install

# Install Playwright browsers (if needed)
pnpm exec playwright install

# Copy environment configuration
cp .env.example .env
```

## Step 3: Configure Environment

Edit `.env` file:

```bash
# Server Configuration
SERVER_PORT=3000
MONGODB_URI=mongodb://localhost:27017/seo-audit
JOB_RETENTION_HOURS=24

# Crawler Configuration (optional - defaults are fine)
CRAWL_MAX_REQUESTS=100
CRAWL_MAX_CONCURRENCY=3
```

If using MongoDB Atlas, update `MONGODB_URI`:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/seo-audit
```

## Step 4: Build the Project

```bash
pnpm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

## Step 5: Start the Server

```bash
pnpm run server
```

You should see:
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

## Step 6: Test the Server

### Test 1: Health Check

Open your browser and go to:
```
http://localhost:3000/api/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T14:30:45.123Z"
}
```

### Test 2: Submit an Audit Job

Open a new terminal and run:

```bash
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "outputFormat": "by-page",
    "doLighthouse": false
  }'
```

You should get a response like:
```json
{
  "status": "queued",
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Audit job queued successfully"
}
```

### Test 3: Check Job Status

Replace `JOB_ID` with the jobId from the previous response:

```bash
curl http://localhost:3000/api/audit/JOB_ID
```

You'll see the job progress:
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "RUNNING",
  "progress": 45,
  ...
}
```

### Test 4: Run the Test Script

We've included a test script that does all of this automatically:

```bash
node test-server.js
```

Or test a specific domain:
```bash
node test-server.js yourdomain.com
```

## Step 7: Use the CLI (Optional)

You can also use the original CLI mode:

```bash
pnpm run audit
```

This will prompt you for a website URL and run the audit interactively.

## What's Next?

Now that you have the server running, you can:

1. **Read the API Documentation**: See [SERVER_API_DOCUMENTATION.md](SERVER_API_DOCUMENTATION.md) for complete API reference
2. **Build a Frontend**: Use the REST API and WebSocket to build a web interface
3. **Integrate with Your App**: Call the API from your application
4. **Deploy to Production**: See deployment recommendations in the documentation

## Common Issues

### "Failed to connect to MongoDB"

**Solution**: Make sure MongoDB is running
```bash
# Windows
Get-Service MongoDB

# Linux/Mac
sudo systemctl status mongod
```

### "Port 3000 already in use"

**Solution**: Change the port in `.env`
```bash
SERVER_PORT=3001
```

### "Module not found" errors

**Solution**: Rebuild the project
```bash
rm -rf dist
pnpm run build
```

## Development Mode

For development with auto-reload:

```bash
# Server with auto-reload
pnpm run dev:server

# CLI with auto-reload
pnpm run dev:audit
```

## Stopping the Server

Press `Ctrl+C` in the terminal where the server is running. The server will:
1. Stop accepting new jobs
2. Wait for current job to complete
3. Close all connections
4. Shut down gracefully

## Next Steps

- **[SERVER_API_DOCUMENTATION.md](SERVER_API_DOCUMENTATION.md)** - Complete API reference
- **[SERVER_SETUP.md](SERVER_SETUP.md)** - Detailed setup guide
- **[README.md](README.md)** - Project overview

## Need Help?

If you encounter any issues:
1. Check the troubleshooting section in [SERVER_SETUP.md](SERVER_SETUP.md)
2. Review the server logs for error messages
3. Open an issue on GitHub

Happy auditing! 🚀

