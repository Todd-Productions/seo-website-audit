# Quick Test Guide - New Features

## Testing JSON Export

### 1. Run a Quick Audit

```bash
pnpm run dev:audit
```

### 2. When Prompted

- Enter a website URL (e.g., `https://example.com`)
- Choose output format (By Page or By Rule)
- Choose whether to run Lighthouse (No for faster testing)

### 3. Check for Success

Look for this message in the console:

```
💾 Results saved to: /path/to/project/tmp/example.com-2024-01-15T14-30-45.json
```

### 4. Verify the File

```bash
# Windows PowerShell
dir tmp

# Linux/Mac
ls -la tmp/
```

You should see a file named like: `example.com-2024-01-15T14-30-45.json`

### 5. Inspect the JSON

```bash
# Windows PowerShell
cat tmp/example.com-*.json | ConvertFrom-Json | ConvertTo-Json

# Linux/Mac
cat tmp/example.com-*.json | jq .
```

The file should contain:
- `site`: The website URL
- `meta`: Audit metadata (runtime, timestamps, counts)
- `score`: Overall SEO score
- `results`: Detailed results (by page or by rule)

---

## Testing Performance Improvements

### Baseline Test (Without Optimizations)

1. **Create/Edit `.env` file**:

```bash
# Disable optimizations for baseline
BLOCK_RESOURCES=false
WAIT_UNTIL=load
CRAWL_MAX_REQUESTS=20
CRAWL_MAX_CONCURRENCY=2
DEBUG=false
```

2. **Run audit and note the time**:

```bash
pnpm run dev:audit
```

3. **Record the completion time** shown at the end:
   ```
   🏁 Finished in 2m 30s
   ```

### Optimized Test (With Optimizations)

1. **Update `.env` file**:

```bash
# Enable all optimizations
BLOCK_RESOURCES=true
BLOCK_IMAGES=true
BLOCK_STYLESHEETS=false
BLOCK_FONTS=true
BLOCK_MEDIA=true
WAIT_UNTIL=domcontentloaded
CRAWL_MAX_REQUESTS=20
CRAWL_MAX_CONCURRENCY=3
DEBUG=false
```

2. **Run the same audit**:

```bash
pnpm run dev:audit
```

3. **Compare the times**:
   - Baseline: `2m 30s`
   - Optimized: `1m 0s`
   - **Improvement: 2.5x faster!**

### Expected Results

| Configuration | 20 Pages | 50 Pages | 100 Pages |
|---------------|----------|----------|-----------|
| Baseline (no optimization) | ~2-3 min | ~5-7 min | ~10-15 min |
| Optimized (default settings) | ~1 min | ~2-3 min | ~4-6 min |
| Maximum Performance | ~45 sec | ~1.5-2 min | ~3-4 min |

---

## Verify Accuracy (Important!)

### Run Both Tests and Compare Results

1. **Save baseline results**:
   ```bash
   # After baseline test
   cp tmp/example.com-*.json tmp/baseline.json
   ```

2. **Save optimized results**:
   ```bash
   # After optimized test
   cp tmp/example.com-*.json tmp/optimized.json
   ```

3. **Compare scores** (should be identical):
   ```bash
   # Windows PowerShell
   (cat tmp/baseline.json | ConvertFrom-Json).score
   (cat tmp/optimized.json | ConvertFrom-Json).score
   
   # Linux/Mac
   jq '.score' tmp/baseline.json
   jq '.score' tmp/optimized.json
   ```

4. **Compare rule violations** (should be identical):
   - Number of errors should match
   - Same pages should fail the same rules
   - Only difference should be in `meta.runtime`

---

## Configuration Presets for Testing

### Maximum Performance (Fastest)

```bash
CRAWL_MAX_REQUESTS=100
CRAWL_MAX_CONCURRENCY=5
NAVIGATION_TIMEOUT=20000
BLOCK_RESOURCES=true
BLOCK_IMAGES=true
BLOCK_STYLESHEETS=true
BLOCK_FONTS=true
BLOCK_MEDIA=true
WAIT_UNTIL=domcontentloaded
```

### Balanced (Recommended)

```bash
CRAWL_MAX_REQUESTS=100
CRAWL_MAX_CONCURRENCY=3
NAVIGATION_TIMEOUT=30000
BLOCK_RESOURCES=true
BLOCK_IMAGES=true
BLOCK_STYLESHEETS=false
BLOCK_FONTS=true
BLOCK_MEDIA=true
WAIT_UNTIL=domcontentloaded
```

### Maximum Accuracy (Slower)

```bash
CRAWL_MAX_REQUESTS=100
CRAWL_MAX_CONCURRENCY=2
NAVIGATION_TIMEOUT=45000
BLOCK_RESOURCES=false
WAIT_UNTIL=load
```

---

## Troubleshooting

### JSON Export Not Working

**Symptom**: No file in `tmp/` directory

**Check**:
1. Look for error message in console
2. Check write permissions on project directory
3. Verify the console shows the export attempt

**Workaround**: Results are still logged to console

### Performance Not Improved

**Check**:
1. Verify `.env` has `BLOCK_RESOURCES=true`
2. Verify `WAIT_UNTIL=domcontentloaded`
3. Try increasing `CRAWL_MAX_CONCURRENCY` to 5

### Different Results Between Tests

**If scores differ**:
1. Make sure you're testing the same website
2. Check if website content changed between tests
3. Verify `CRAWL_MAX_REQUESTS` is the same for both tests
4. Some websites have dynamic content that changes

**Small differences are normal** due to:
- Dynamic content on the website
- Different pages discovered in each crawl
- Network timing variations

---

## Quick Validation Checklist

- [ ] JSON file is created in `tmp/` directory
- [ ] Filename format is correct: `[domain]-[timestamp].json`
- [ ] JSON file contains valid JSON (can be parsed)
- [ ] JSON has `site`, `meta`, `score`, and `results` fields
- [ ] Console shows export success message
- [ ] Optimized crawl is faster than baseline
- [ ] SEO scores are consistent between tests
- [ ] No new errors or warnings in console
- [ ] All existing functionality still works

---

## Next Steps After Testing

1. **Update your `.env`** with your preferred settings
2. **Run production audits** with optimized settings
3. **Monitor the `tmp/` directory** - consider cleaning old files periodically
4. **Share feedback** on performance improvements observed
5. **Report any issues** with accuracy or functionality

