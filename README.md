# SEO Website Audit Tool

A comprehensive SEO audit tool that can be used as both a **command-line interface (CLI)** and a **REST API server** with real-time WebSocket updates.

## Features

- ✅ **CLI Mode** - Interactive command-line audit tool
- ✅ **API Server** - REST API with asynchronous job processing
- ✅ **Real-Time Updates** - WebSocket support for live progress tracking
- ✅ **MongoDB Persistence** - Store and retrieve audit results
- ✅ **Comprehensive SEO Checks** - 8+ page-level and 3+ site-level rules
- ✅ **Lighthouse Integration** - Optional performance audits
- ✅ **Flexible Output** - Results by page or by rule
- ✅ **Automatic Cleanup** - Scheduled job retention management

## Quick Start

### Installation

```bash
# Install dependencies
pnpm install

# Install Playwright browsers (if needed)
pnpm exec playwright install

# Copy environment configuration
cp .env.example .env

# Build the project
pnpm run build
```

### CLI Usage

```bash
# Run interactive audit
pnpm run audit

# Or in development mode
pnpm run dev:audit
```

### Server Usage

```bash
# Start the API server
pnpm run server

# Or in development mode with auto-reload
pnpm run dev:server
```

For detailed server setup instructions, see [SERVER_SETUP.md](SERVER_SETUP.md)

## How It Works

1. Prompt the user for the URL of the website to audit
2. Clean The URL and ensure website is valid
3. See if the website has a sitemap.xml
4. Crawls to see how many pages the website has
5. Performs a series of checks to see if the website is SEO friendly
   1. Check if the website has a sitemap.xml
   2. Check if the website has a robots.txt file
   3. Check meta tags (title, description, keywords, canonical tag)
   4. Check for broken links
   5. Check for missing alt tags
   6. Performs a lighthouse audit
6. Generates a report of results (JSON) and performance score

## API Server

The server provides a REST API and WebSocket interface for managing SEO audit jobs.

### API Endpoints

- **POST /api/audit** - Submit new audit job
- **GET /api/audit/:jobId** - Get job status and results
- **GET /api/health** - Health check
- **WS /ws/audit/:jobId** - WebSocket for real-time updates

### Example: Submit Audit Job

```bash
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "outputFormat": "by-page",
    "doLighthouse": false
  }'
```

### Example: WebSocket Connection

```javascript
const ws = new WebSocket("ws://localhost:3000/ws/audit/:jobId");

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(`Progress: ${message.progress}%`);
};
```

For complete API documentation, see [SERVER_API_DOCUMENTATION.md](SERVER_API_DOCUMENTATION.md)

### Test the Server

```bash
# Run the test script
node test-server.js

# Or test a specific domain
node test-server.js yourdomain.com
```

## Configuration

All configuration is done through environment variables in `.env`:

### Server Configuration

| Variable            | Description                     | Default                             |
| ------------------- | ------------------------------- | ----------------------------------- |
| SERVER_PORT         | HTTP server port                | 3000                                |
| MONGODB_URI         | MongoDB connection string       | mongodb://localhost:27017/seo-audit |
| JOB_RETENTION_HOURS | How long to keep completed jobs | 24                                  |

### Crawler Configuration

| Variable              | Description                      | Default |
| --------------------- | -------------------------------- | ------- |
| CRAWL_MAX_REQUESTS    | Maximum pages to crawl per audit | 100     |
| CRAWL_MAX_CONCURRENCY | Concurrent crawl requests        | 3       |
| NAVIGATION_TIMEOUT    | Page load timeout (ms)           | 30000   |
| REQUEST_TIMEOUT       | HTTP request timeout (ms)        | 30000   |

See `.env.example` for all available configuration options.

## Documentation

- **[SERVER_SETUP.md](SERVER_SETUP.md)** - Quick setup guide for the API server
- **[SERVER_API_DOCUMENTATION.md](SERVER_API_DOCUMENTATION.md)** - Complete API reference
- **[SERVER_IMPLEMENTATION_SUMMARY.md](SERVER_IMPLEMENTATION_SUMMARY.md)** - Technical implementation details
- **[CRAWLER_OPTIMIZATIONS.md](CRAWLER_OPTIMIZATIONS.md)** - Crawler performance improvements
- **[QUICK_TEST_GUIDE.md](QUICK_TEST_GUIDE.md)** - Testing guide

## Architecture

### CLI Mode

```
User Input → Audit Runner → Crawler → SEO Rules → Results → Console/File
```

### Server Mode

```
HTTP Request → Job Queue → Audit Runner → Crawler → SEO Rules → MongoDB
                    ↓
              WebSocket Updates → Client
```

## SEO Rules

### Page-Level Rules (8)

- ✅ Has Title Tag
- ✅ Has Meta Description
- ✅ Uses HTTPS
- ✅ No Mixed Content
- ✅ No 4xx Errors
- ✅ No 5xx Errors
- ✅ No Redirect Loops
- ✅ Title Not Too Long

### Site-Level Rules (3)

- ✅ Has robots.txt
- ✅ Has sitemap.xml
- ✅ Sitemap is Complete

## Requirements

- **Node.js** 18+
- **MongoDB** (for server mode)
- **pnpm** (or npm/yarn)

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
Get-Service MongoDB  # Windows
systemctl status mongod  # Linux

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env
```

### Port Already in Use

```bash
# Change SERVER_PORT in .env
SERVER_PORT=3001
```

### Build Errors

```bash
# Clean and rebuild
rm -rf node_modules dist
pnpm install
pnpm run build
```

## Future Enhancements

- [ ] Authentication and API keys
- [ ] Rate limiting
- [ ] Concurrent job processing
- [ ] Redis job queue
- [ ] Frontend dashboard
- [ ] Scheduled audits
- [ ] Email notifications
- [ ] WordPress-specific checks
- [ ] Accessibility audits
- [ ] Custom rule configuration

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
