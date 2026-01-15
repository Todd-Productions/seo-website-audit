# SEO Audit Server - API Documentation

## Overview

The SEO Audit Server provides a REST API and WebSocket interface for managing SEO audit jobs. It integrates with the existing SEO audit crawler functionality and provides scalable, asynchronous job processing with real-time updates.

---

## Quick Start

### Prerequisites

1. **MongoDB** - Install and run MongoDB locally or use a cloud instance
2. **Node.js** - Version 18+ required
3. **Dependencies** - Install with `pnpm install`

### Installation

```bash
# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env
# Edit .env and set MONGODB_URI if needed

# Build the project
pnpm run build

# Start the server
pnpm run server

# Or for development with auto-reload
pnpm run dev:server
```

### Default Configuration

- **Server Port**: 3000
- **MongoDB URI**: `mongodb://localhost:27017/seo-audit`
- **Job Retention**: 24 hours

---

## REST API Endpoints

### Base URL

```
http://localhost:3000/api
```

### 1. Health Check

**Endpoint**: `GET /api/health`

**Description**: Check if the server is running

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T14:30:45.123Z"
}
```

---

### 2. Submit Audit Job

**Endpoint**: `POST /api/audit`

**Description**: Submit a new SEO audit job

**Request Body**:
```json
{
  "domain": "example.com",
  "outputFormat": "by-page",
  "doLighthouse": false
}
```

**Parameters**:
- `domain` (string, required) - Website URL to audit (with or without http/https)
- `outputFormat` (string, required) - Either `"by-page"` or `"by-rule"`
- `doLighthouse` (boolean, required) - Whether to run Lighthouse performance audit

**Response Scenarios**:

#### Success (HTTP 201)
```json
{
  "status": "queued",
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Audit job queued successfully"
}
```

#### Redirect Detected (HTTP 302)
```json
{
  "status": "redirect",
  "redirectUrl": "https://www.example.com",
  "message": "Domain redirects to different URL. Please confirm and resubmit."
}
```

#### Validation Error (HTTP 400)
```json
{
  "status": "error",
  "message": "Missing required fields: domain, outputFormat, doLighthouse"
}
```

#### Server Error (HTTP 500)
```json
{
  "status": "error",
  "message": "Internal server error"
}
```

---

### 3. Get Job Status

**Endpoint**: `GET /api/audit/:jobId`

**Description**: Get the status and results of an audit job

**Parameters**:
- `jobId` (string, required) - UUID of the job

**Response** (HTTP 200):
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED",
  "createdAt": "2024-01-15T14:30:45.123Z",
  "completedAt": "2024-01-15T14:32:15.456Z",
  "progress": 100,
  "results": {
    "website": "https://example.com",
    "overallScore": 85,
    "totalUrls": 42,
    "totalPages": 38,
    "indexedPages": 35,
    "pages": [...]
  },
  "error": null
}
```

**Job Status Values**:
- `PENDING` - Job is queued and waiting to be processed
- `RUNNING` - Job is currently being processed
- `COMPLETED` - Job finished successfully
- `FAILED` - Job failed with an error

**Error Response** (HTTP 404):
```json
{
  "status": "error",
  "message": "Job not found"
}
```

---

## WebSocket Interface

### Connection

**Endpoint**: `ws://localhost:3000/ws/audit/:jobId`

**Description**: Connect to receive real-time updates for a specific job

**Example** (JavaScript):
```javascript
const jobId = "550e8400-e29b-41d4-a716-446655440000";
const ws = new WebSocket(`ws://localhost:3000/ws/audit/${jobId}`);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(message);
};
```

### Message Types

#### Status Update
```json
{
  "type": "status",
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "RUNNING",
  "progress": 45,
  "message": "Processing URL 23/50: https://example.com/page",
  "timestamp": "2024-01-15T14:31:30.789Z"
}
```

#### Completion
```json
{
  "type": "complete",
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED",
  "results": {
    "website": "https://example.com",
    "overallScore": 85,
    ...
  },
  "timestamp": "2024-01-15T14:32:15.456Z"
}
```

#### Error
```json
{
  "type": "error",
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "FAILED",
  "error": "Crawl failed: Connection timeout",
  "timestamp": "2024-01-15T14:31:45.123Z"
}
```

---

## Architecture

### Components

1. **Express Server** (`src/cmd/server.ts`)
   - HTTP server for REST API
   - WebSocket server for real-time updates
   - Graceful shutdown handling

2. **Job Model** (`src/models/job.model.ts`)
   - MongoDB schema and operations
   - Job CRUD operations
   - Database connection management

3. **Job Queue** (`src/lib/job-queue.ts`)
   - Polls for pending jobs every 5 seconds
   - Processes one job at a time
   - Updates job status and progress
   - Handles job failures

4. **WebSocket Manager** (`src/lib/websocket.ts`)
   - Manages WebSocket connections
   - Broadcasts updates to connected clients
   - Handles client disconnections

5. **Audit Service** (`src/lib/audit-service.ts`)
   - Core audit logic extracted from CLI
   - Progress callbacks for real-time updates
   - Reusable audit functionality

6. **API Routes** (`src/routes/audit.routes.ts`)
   - REST API endpoint handlers
   - Request validation
   - Domain validation and redirect detection

---

## Data Flow

```
1. Client submits job via POST /api/audit
2. Server validates domain and creates job in MongoDB
3. Job status set to PENDING
4. Server returns jobId to client
5. Client connects to WebSocket /ws/audit/:jobId
6. Job queue picks up PENDING job
7. Job status updated to RUNNING
8. Audit runs with progress callbacks
9. Progress updates sent via WebSocket
10. Job status updated to COMPLETED/FAILED
11. Results stored in MongoDB
12. Final update sent via WebSocket
```

---

## MongoDB Schema

### Jobs Collection

```javascript
{
  _id: ObjectId,
  jobId: String (UUID, unique index),
  domain: String,
  outputFormat: String, // 'by-page' or 'by-rule'
  doLighthouse: Boolean,
  status: String, // 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'
  createdAt: Date,
  startedAt: Date,
  completedAt: Date,
  progress: Number, // 0-100
  results: Object, // Audit results when completed
  error: String, // Error message if failed
  logFilePath: String // Path to log file
}
```

### Indexes

- `jobId` - Unique index for fast lookups
- `status` - Index for queue processing
- `createdAt` - Index for cleanup operations

---

## Cleanup Job

### Daily Cleanup

The server runs a daily cleanup job at midnight (00:00) that:

1. Deletes jobs with status `COMPLETED` older than 24 hours (configurable)
2. Deletes associated log files from the `logs/` directory
3. Logs cleanup statistics

### Configuration

Set `JOB_RETENTION_HOURS` in `.env` to change retention period:

```bash
JOB_RETENTION_HOURS=48  # Keep jobs for 48 hours
```

---

## Error Handling

### Graceful Shutdown

The server handles shutdown signals gracefully:

1. Stops accepting new jobs
2. Waits for current job to complete (if any)
3. Closes all WebSocket connections
4. Closes HTTP server
5. Disconnects from MongoDB
6. Exits cleanly

**Signals Handled**:
- `SIGTERM` - Termination signal
- `SIGINT` - Interrupt signal (Ctrl+C)
- `uncaughtException` - Unhandled exceptions
- `unhandledRejection` - Unhandled promise rejections

### Job Failures

When a job fails:
1. Error is logged to console and log file
2. Job status updated to `FAILED`
3. Error message stored in job document
4. Error sent to WebSocket clients
5. Job queue continues processing next job

---

## Logging

### Console Logging

All server operations are logged to console using the existing logger (`src/lib/logger.ts`):

- Server startup/shutdown
- Job creation/completion
- WebSocket connections
- Errors and warnings

### File Logging

Each audit job creates a log file in `logs/` directory:

- Filename: `[domain]-[timestamp].log`
- Contains all audit-specific logs
- Automatically cleaned up after retention period

---

## Example Usage

### Submit Job and Monitor Progress

```javascript
// Submit job
const response = await fetch('http://localhost:3000/api/audit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    domain: 'example.com',
    outputFormat: 'by-page',
    doLighthouse: false
  })
});

const { jobId } = await response.json();

// Connect to WebSocket for real-time updates
const ws = new WebSocket(`ws://localhost:3000/ws/audit/${jobId}`);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'status') {
    console.log(`Progress: ${message.progress}% - ${message.message}`);
  } else if (message.type === 'complete') {
    console.log('Audit complete!', message.results);
    ws.close();
  } else if (message.type === 'error') {
    console.error('Audit failed:', message.error);
    ws.close();
  }
};

// Or poll for status
setInterval(async () => {
  const statusResponse = await fetch(`http://localhost:3000/api/audit/${jobId}`);
  const status = await statusResponse.json();
  console.log(status);
  
  if (status.status === 'COMPLETED' || status.status === 'FAILED') {
    clearInterval(this);
  }
}, 5000);
```

---

## Configuration

### Environment Variables

See `.env.example` for all available configuration options:

```bash
# Server
SERVER_PORT=3000
MONGODB_URI=mongodb://localhost:27017/seo-audit
JOB_RETENTION_HOURS=24

# Crawl settings
CRAWL_MAX_REQUESTS=100
CRAWL_MAX_CONCURRENCY=3

# Timeouts
NAVIGATION_TIMEOUT=30000
REQUEST_TIMEOUT=30000

# Performance
BLOCK_RESOURCES=true
BLOCK_IMAGES=true
WAIT_UNTIL=domcontentloaded

# Debug
DEBUG=false
```

---

## Troubleshooting

### Server won't start

**Check MongoDB connection**:
```bash
# Test MongoDB connection
mongosh mongodb://localhost:27017/seo-audit
```

**Check port availability**:
```bash
# Check if port 3000 is in use
netstat -an | grep 3000
```

### Jobs stuck in PENDING

**Check job queue**:
- Job queue processes jobs every 5 seconds
- Only one job runs at a time
- Check server logs for errors

**Manually check database**:
```javascript
// In MongoDB shell
use seo-audit
db.jobs.find({ status: 'PENDING' })
```

### WebSocket not connecting

**Check WebSocket path**:
- Must include jobId: `/ws/audit/:jobId`
- Use `ws://` not `http://`

**Check CORS settings**:
- Server has CORS enabled by default
- Check browser console for errors

---

## Security Considerations

### Production Deployment

1. **Use HTTPS/WSS** - Enable TLS for production
2. **Add Authentication** - Implement API key or JWT authentication
3. **Rate Limiting** - Add rate limiting to prevent abuse
4. **Input Validation** - Already implemented, but review for your use case
5. **MongoDB Security** - Use authentication and encryption
6. **Environment Variables** - Never commit `.env` file

### Recommended Additions

```javascript
// Add to server.ts for production

// Rate limiting
import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// API key authentication
app.use('/api/', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

---

## Performance

### Concurrent Jobs

Currently processes **one job at a time** to prevent resource exhaustion.

To enable concurrent processing:
1. Modify `JobQueue.processNextJob()` to track multiple jobs
2. Add concurrency limit configuration
3. Ensure adequate server resources

### Scaling

For high-volume deployments:

1. **Horizontal Scaling** - Run multiple server instances
2. **Job Queue** - Use Redis or RabbitMQ instead of polling
3. **Database** - Use MongoDB replica set
4. **Load Balancer** - Distribute requests across instances

---

## Next Steps

1. **Test the API** - Use the examples above
2. **Monitor Logs** - Check console and log files
3. **Review Configuration** - Adjust settings for your needs
4. **Add Authentication** - Implement security for production
5. **Deploy** - Set up production environment

For more information, see:
- `CRAWLER_OPTIMIZATIONS.md` - Crawler performance improvements
- `QUICK_TEST_GUIDE.md` - Testing the audit functionality
- `.env.example` - All configuration options

