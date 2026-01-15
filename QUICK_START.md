# Quick Start Guide - Enhanced SEO Audit Tool

## Running the Tool

```bash
# Development mode (recommended)
pnpm run dev:audit

# Production mode (after building)
pnpm run build
pnpm run audit
```

## Interactive Prompts

When you run the tool, you'll be prompted for:

1. **Website URL**: Enter the website to audit (e.g., `example.com`)
2. **Output Format**: Choose between:
   - **By Page** - Results grouped by URL with nested rule violations
   - **By Rule** - Results grouped by rule type with nested URL violations
3. **Lighthouse Audit**: Choose whether to run Lighthouse performance audit

## Output Format Examples

### By Page Format

Shows each page with its score and all rule violations:

```json
{
  "site": "example.com",
  "score": 85,
  "results": [
    {
      "url": "/about",
      "score": 90,
      "rules": [
        {
          "rule": "has_title_tag",
          "type": "ERROR",
          "calc_weight": 3,
          "errors": []
        }
      ]
    }
  ]
}
```

### By Rule Format

Shows each rule with all pages that violate it:

```json
{
  "site": "example.com",
  "score": 85,
  "results": [
    {
      "rule": "has_title_tag",
      "type": "ERROR",
      "calc_weight": 3,
      "errors": [
        {
          "url": "/contact",
          "message": "Missing title tag"
        }
      ]
    }
  ]
}
```

## SEO Rules Checked

### Page-Level Rules (checked on every page)

- ✅ **has_title_tag** (ERROR) - Checks for title tag presence
- ✅ **has_description_tag** (ERROR) - Checks for meta description
- ✅ **has_https** (ERROR) - Verifies HTTPS encryption
- ⚠️ **has_mixed_content** (WARNING) - Detects HTTP resources on HTTPS pages
- ✅ **has_4xx_errors** (ERROR) - Identifies client errors
- ✅ **has_5xx_errors** (ERROR) - Identifies server errors
- ✅ **has_redirect_loops** (ERROR) - Detects circular redirects
- ⚠️ **title_too_long** (WARNING) - Checks if title exceeds 60 characters

### Site-Level Rules (checked once per audit)

- ⚠️ **has_robots_txt** (WARNING) - Checks for robots.txt presence
- ⚠️ **has_sitemap_xml** (WARNING) - Checks for sitemap.xml presence
- ℹ️ **sitemap_complete** (NOTICE) - Validates sitemap completeness

## Scoring System

The tool uses a **proportional scoring system**:

- Each rule has a weight based on severity:

  - ERROR = 3 points
  - WARNING = 2 points
  - NOTICE = 1 point

- **Proportional Deduction**: If 3 out of 10 pages fail a rule, you lose 30% of that rule's weight
- **Overall Score**: Calculated as (earned points / total possible points) × 100

### Example

- 10 pages crawled
- Rule: `has_title_tag` (ERROR, weight=3)
- 8 pages pass, 2 pages fail
- Points earned: 3 × 8 = 24
- Points possible: 3 × 10 = 30
- Contribution to score: 24/30 = 80% of this rule's weight

## Crawler Behavior

### With Sitemap

- Discovers sitemap.xml automatically
- Crawls all URLs listed in sitemap
- Validates sitemap completeness

### Without Sitemap

- Starts from homepage
- Follows internal links
- Limited by `CRAWL_MAX_REQUESTS` setting

## Configuration

Edit `.env` file to configure crawler:

```env
CRAWL_MAX_REQUESTS=1000    # Maximum pages to crawl
CRAWL_MAX_CONCURRENCY=5    # Concurrent requests
```

## Output Location

Results are logged to console in JSON format. You can redirect to a file:

```bash
pnpm run dev:audit > audit-results.json 2>&1
```

## Troubleshooting

### Issue: Crawler not finding pages

- **Solution**: Check if sitemap.xml exists and is accessible
- **Fallback**: Tool will crawl from homepage if no sitemap found

### Issue: Low score despite good SEO

- **Check**: Review the proportional scoring - even a few failures can impact score
- **Review**: Check both page-level and site-level rule violations

### Issue: Build errors

- **Solution**: Run `pnpm install` to ensure all dependencies are installed
- **Solution**: Make sure TypeScript is properly installed

## Next Steps

1. Run an audit on your website
2. Review the output in your chosen format
3. Fix any ERROR-level issues first
4. Address WARNING-level issues
5. Consider NOTICE-level suggestions
6. Re-run audit to see improved score

## Support

For issues or questions, refer to:

- `ENHANCEMENT_SUMMARY.md` - Detailed technical documentation
- `README.md` - Original project documentation
