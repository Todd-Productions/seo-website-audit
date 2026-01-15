# Crawler Optimizations - Quick Test Guide

## Quick Test (5 minutes)

This guide helps you verify all three crawler optimizations are working correctly.

---

## Prerequisites

1. Make sure you have the latest code
2. Install dependencies: `pnpm install`
3. Create a `.env` file (or use defaults)

---

## Test 1: Verify No Duplicate URLs

### Steps

1. **Enable debug mode** to see detailed logs:
   ```bash
   # In .env file or export
   DEBUG=true
   ```

2. **Run the audit**:
   ```bash
   pnpm run dev:audit
   ```

3. **Enter test website**:
   ```
   https://www.3rdcoastcoffee.com
   ```

4. **Choose options**:
   - Output format: By Page (or By Rule)
   - Lighthouse: No (faster for testing)

### What to Look For

✅ **Success Indicators**:
- Progress logs show each URL only once
- Debug logs show: `Normalized URL for queue: https://...`
- Home page (`/`) appears only once in the crawl
- No duplicate URLs in final results

❌ **Failure Indicators**:
- Same URL appears multiple times in progress logs
- Home page crawled 2+ times
- Duplicate entries in results

### Example Output

```
🔄 [5s 123ms] Processing URL 1/100: https://www.3rdcoastcoffee.com
🔍 [5s 125ms] DEBUG: Normalized URL for queue: https://www.3rdcoastcoffee.com/about
🔍 [5s 126ms] DEBUG: Normalized URL for queue: https://www.3rdcoastcoffee.com/menu
...
```

---

## Test 2: Verify Log File Export

### Steps

1. **Run the audit** (same as Test 1)

2. **Wait for completion**

3. **Check console output** at the end:
   ```
   📝 Log file saved to: D:\WEB APPS\seo-website-audit\logs\3rdcoastcoffee.com-2024-01-15T14-30-45.log
   ```

4. **Verify log file exists**:
   ```bash
   # Check logs directory
   ls logs/
   
   # Should show: 3rdcoastcoffee.com-[timestamp].log
   ```

5. **Open the log file** and verify contents

### What to Look For

✅ **Success Indicators**:
- `logs/` directory created
- Log file exists with correct naming: `[domain]-[timestamp].log`
- Console shows: `📝 Log file saved to: ...`
- Log file contains:
  - Header with website and timestamp
  - All custom logger output (info, debug, success, etc.)
  - Timestamps for each log entry
  - Complete audit trail

❌ **Failure Indicators**:
- No `logs/` directory
- No log file created
- Log file is empty
- Log file contains Crawlee's internal logs (should be console-only)

### Example Log File Content

```
=== SEO Website Audit Log ===
Website: https://www.3rdcoastcoffee.com
Started: 2024-01-15T14:30:45.123Z
==================================================

ℹ️  [0s 16ms] === SEO Website Audit Tool ===
ℹ️  [0s 16ms] Debug mode: ON
ℹ️  [0s 234ms] Target website: https://www.3rdcoastcoffee.com
ℹ️  [1s 456ms] Log file created: D:\WEB APPS\seo-website-audit\logs\3rdcoastcoffee.com-2024-01-15T14-30-45.log
...
```

---

## Test 3: Verify Image URL Exclusion

### Steps

1. **Enable debug mode** (if not already):
   ```bash
   DEBUG=true
   ```

2. **Run the audit** against a site with images:
   ```bash
   pnpm run dev:audit
   ```

3. **Enter test website**:
   ```
   https://www.3rdcoastcoffee.com
   ```

4. **Watch debug logs** during crawl

### What to Look For

✅ **Success Indicators**:
- Debug logs show: `Excluding image URL from crawl queue: https://.../image.jpg`
- Debug logs show: `Filtered out X image URL(s) from page links`
- Progress logs show NO `.jpg`, `.png`, `.gif`, etc. URLs being processed
- Crawl completes faster than before

❌ **Failure Indicators**:
- Progress logs show image URLs being crawled
- No "Excluding image URL" messages in debug logs
- Image files appear in final results

### Example Debug Output

```
🔍 [3s 456ms] DEBUG: Gathering page links
🔍 [3s 567ms] DEBUG: Excluding image URL from crawl queue: https://www.3rdcoastcoffee.com/images/logo.png
🔍 [3s 568ms] DEBUG: Excluding image URL from crawl queue: https://www.3rdcoastcoffee.com/photos/coffee.jpg
🔍 [3s 569ms] DEBUG: Excluding image URL from crawl queue: https://www.3rdcoastcoffee.com/assets/banner.webp
🔍 [3s 570ms] DEBUG: Filtered out 15 image URL(s) from page links
🔍 [3s 571ms] DEBUG: Found 42 links
```

---

## Test 4: Combined Performance Test

### Baseline Test (Before Optimizations)

If you want to compare performance, you can temporarily disable the optimizations:

1. **Comment out URL normalization** in `src/crawler/audit.crawler.ts`
2. **Comment out image filtering** in `src/crawler/actions/links.ts`
3. **Run audit** and note the time

### Optimized Test (After Optimizations)

1. **Restore the optimizations**
2. **Run audit** and note the time
3. **Compare results**

### Expected Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Total URLs crawled | Higher | Lower | 10-30% fewer |
| Duplicate URLs | Yes | No | 100% eliminated |
| Image URLs crawled | Yes | No | 100% eliminated |
| Total time | Baseline | Faster | 10-30% faster |
| Log file | No | Yes | Permanent record |

---

## Troubleshooting

### Issue: No log file created

**Check**:
1. Look for error message in console
2. Check write permissions on project directory
3. Verify `initializeFileLogging()` was called

**Solution**:
- Logs are still in console even if file fails
- Check console for error messages

### Issue: Still seeing duplicate URLs

**Check**:
1. Verify `transformRequestFunction` is in `enqueueLinks()`
2. Check debug logs for "Normalized URL" messages
3. Make sure you're using the latest code

**Solution**:
- Review `src/crawler/audit.crawler.ts` changes
- Ensure `strategy: "same-domain"` is set

### Issue: Image URLs still being crawled

**Check**:
1. Verify `isImageUrl()` function exists in `src/crawler/actions/links.ts`
2. Check debug logs for "Excluding image URL" messages
3. Make sure debug mode is enabled to see the logs

**Solution**:
- Review `src/crawler/actions/links.ts` changes
- Enable `DEBUG=true` to see filtering in action

---

## Quick Verification Checklist

After running one audit, verify:

- [ ] No duplicate URLs in progress logs
- [ ] Log file created in `logs/` directory
- [ ] Log file has correct naming format
- [ ] Log file contains audit trail
- [ ] Debug logs show URL normalization
- [ ] Debug logs show image URL exclusion
- [ ] No image URLs in crawl progress
- [ ] Audit completes successfully
- [ ] Results are accurate
- [ ] Console output still works

---

## Success Criteria

All three optimizations are working if:

1. ✅ Each URL is crawled exactly once (no duplicates)
2. ✅ Log file is created with domain-timestamp naming
3. ✅ Image URLs are excluded from crawling
4. ✅ Audit completes faster than before
5. ✅ Results are accurate and complete

---

## Next Steps

Once verified:

1. **Disable debug mode** for production use:
   ```bash
   DEBUG=false
   ```

2. **Review log files** in `logs/` directory as needed

3. **Clean up old logs** periodically:
   ```bash
   # Delete logs older than 30 days
   # (Manual cleanup - logs/ is in .gitignore)
   ```

4. **Enjoy faster, more reliable audits!** 🚀

