# Troubleshooting Guide: Timeout and Freeze Issues

## Overview

This guide helps diagnose and fix timeout/freeze issues when running the SEO audit tool.

## Common Symptoms

- Script hangs indefinitely without completing
- No error messages displayed
- Process appears frozen during crawling
- Timeout errors during sitemap parsing or page crawling

## Root Causes & Solutions

### 1. **Large Sitemap Causing Timeout**

**Symptoms:**
- Script freezes after "Checking for sitemap"
- No progress after sitemap detection

**Causes:**
- Website has a sitemap index with many child sitemaps
- Sitemap contains thousands of URLs
- Slow server response when fetching sitemap

**Solutions:**

```bash
# Reduce max requests
CRAWL_MAX_REQUESTS=50

# Increase sitemap timeout
SITEMAP_TIMEOUT=30000

# Enable debug mode to see progress
DEBUG=true
```

**What was fixed:**
- Added timeout controls to sitemap fetching
- Implemented automatic URL limiting when sitemap is too large
- Added support for sitemap indexes with child sitemap fetching
- Added early termination when max requests limit is reached

---

### 2. **Slow Page Load Times**

**Symptoms:**
- Script hangs on specific URLs
- Progress stops at "Processing URL X/Y"

**Causes:**
- Pages take too long to load
- Heavy JavaScript execution
- Large media files or resources

**Solutions:**

```bash
# Increase navigation timeout
NAVIGATION_TIMEOUT=60000

# Reduce concurrency to avoid overwhelming the server
CRAWL_MAX_CONCURRENCY=1

# Enable debug mode
DEBUG=true
```

**What was fixed:**
- Added configurable navigation timeouts (default: 30 seconds)
- Added request handler timeouts (default: 30 seconds)
- Implemented automatic retry logic (default: 2 retries)
- Added comprehensive error handling for failed page loads

---

### 3. **Infinite Crawling Loop**

**Symptoms:**
- Crawler keeps finding new URLs indefinitely
- Never reaches completion

**Causes:**
- Website has dynamic URL generation
- Pagination or calendar pages creating infinite URLs
- Query parameters creating unique URLs

**Solutions:**

```bash
# Set strict max requests limit
CRAWL_MAX_REQUESTS=100

# Reduce concurrency
CRAWL_MAX_CONCURRENCY=2
```

**What was fixed:**
- Enforced strict `maxRequestsPerCrawl` limit
- Added progress logging showing "X/Y" URLs processed
- Crawler automatically stops at max requests limit

---

### 4. **Memory Issues**

**Symptoms:**
- Script slows down over time
- System becomes unresponsive
- Out of memory errors

**Causes:**
- Too many concurrent requests
- Large dataset accumulation
- Browser instances not being cleaned up

**Solutions:**

```bash
# Reduce concurrency significantly
CRAWL_MAX_CONCURRENCY=1

# Limit total requests
CRAWL_MAX_REQUESTS=50
```

**What was fixed:**
- Reduced default concurrency from 5 to 3
- Reduced default max requests from 500 to 100
- Playwright automatically manages browser cleanup

---

### 5. **Network Timeouts**

**Symptoms:**
- "ETIMEDOUT" or "ECONNREFUSED" errors
- Script hangs during HTTP requests

**Causes:**
- Slow network connection
- Server rate limiting
- Firewall blocking requests

**Solutions:**

```bash
# Increase all timeouts
NAVIGATION_TIMEOUT=60000
REQUEST_TIMEOUT=60000
SITEMAP_TIMEOUT=30000

# Reduce concurrency to avoid rate limiting
CRAWL_MAX_CONCURRENCY=1

# Increase retries
MAX_RETRIES=3
```

**What was fixed:**
- Added timeout controls for all HTTP requests
- Added User-Agent header to avoid bot blocking
- Implemented retry logic with configurable max retries
- Added graceful error handling for network failures

---

## Debug Mode

Enable debug mode to see detailed step-by-step logging:

```bash
# In .env file
DEBUG=true
```

**Debug output includes:**
- Sitemap fetching progress
- URL classification details
- SEO rule evaluation progress
- Link gathering status
- Data saving confirmation
- Detailed error messages with stack traces

**Example debug output:**
```
🔍 [5s 234ms] DEBUG: Trying sitemap URL: https://example.com/sitemap.xml
✅ [6s 123ms] Found sitemap at: https://example.com/sitemap.xml
📍 [6s 150ms] STEP: parseSitemap
🔍 [6s 200ms] DEBUG: Found 150 URLs in urlset
⚠️  [6s 250ms] WARNING: Sitemap contains 150 URLs, limiting to 100
🔄 [7s 100ms] Processing URL 1/100: https://example.com/
📍 [7s 120ms] STEP: requestHandler
```

---

## Recommended Configuration for Different Scenarios

### Testing / Debugging
```bash
DEBUG=true
CRAWL_MAX_REQUESTS=10
CRAWL_MAX_CONCURRENCY=1
NAVIGATION_TIMEOUT=60000
```

### Small Website (< 50 pages)
```bash
CRAWL_MAX_REQUESTS=50
CRAWL_MAX_CONCURRENCY=5
NAVIGATION_TIMEOUT=20000
```

### Medium Website (50-200 pages)
```bash
CRAWL_MAX_REQUESTS=200
CRAWL_MAX_CONCURRENCY=3
NAVIGATION_TIMEOUT=30000
```

### Large Website (> 200 pages)
```bash
CRAWL_MAX_REQUESTS=500
CRAWL_MAX_CONCURRENCY=2
NAVIGATION_TIMEOUT=45000
```

### Slow/Problematic Website
```bash
DEBUG=true
CRAWL_MAX_REQUESTS=50
CRAWL_MAX_CONCURRENCY=1
NAVIGATION_TIMEOUT=60000
REQUEST_TIMEOUT=60000
SITEMAP_TIMEOUT=30000
MAX_RETRIES=3
```

---

## How to Test with toddproductions.com

1. **Create a `.env` file** (copy from `.env.example`):
```bash
cp .env.example .env
```

2. **Start with conservative settings**:
```bash
DEBUG=true
CRAWL_MAX_REQUESTS=20
CRAWL_MAX_CONCURRENCY=1
NAVIGATION_TIMEOUT=45000
REQUEST_TIMEOUT=45000
SITEMAP_TIMEOUT=20000
```

3. **Run the audit**:
```bash
pnpm run dev:audit
```

4. **Monitor the debug output** to see where it might be getting stuck

5. **Adjust settings** based on what you observe

---

## Still Having Issues?

If the script still hangs, check the debug output for:

1. **Last successful step** - This tells you where it's freezing
2. **URL being processed** - Some specific URLs might be problematic
3. **Error messages** - Look for timeout or network errors

Common fixes:
- Skip problematic URLs by reducing max requests
- Increase timeouts for slow-loading pages
- Reduce concurrency to 1 for maximum stability
- Check if the website is blocking automated requests

