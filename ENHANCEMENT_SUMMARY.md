# SEO Audit Tool Enhancement Summary

## Overview

This document summarizes the enhancements made to the SEO Website Audit command-line tool based on the specified requirements.

## Features Implemented

### 1. Export Format Selection

- **New Prompt**: Added `promptForOutputFormat()` to allow users to choose between two output formats:
  - **By Page**: Groups results by URL with nested rule violations
  - **By Rule**: Groups results by rule type with nested URL violations
- **Location**: `src/prompts/outputFormat.prompt.ts`

### 2. Output Structure

Both formats follow the specified JSON schemas with the following structure:

#### By Page Format

```json
{
  "site": "example.com",
  "meta": {
    "runtime": "00:05:05:00",
    "start": "ISO timestamp",
    "end": "ISO timestamp",
    "status": "SUCCESS"
  },
  "score": 90,
  "results": [
    {
      "url": "/about",
      "score": 90,
      "rules": [...]
    }
  ]
}
```

#### By Rule Format

```json
{
  "site": "example.com",
  "meta": {...},
  "score": 90,
  "results": [
    {
      "rule": "has_title_tag",
      "type": "ERROR",
      "calc_weight": 3,
      "errors": [...]
    }
  ]
}
```

- **Implementation**: `src/lib/formatters.ts`
- **Types**: `src/types/audit.ts`

### 3. Proportional Scoring System

- Implemented proportional scoring where partial rule failures affect the score proportionally
- If 1 out of 10 pages fails a rule, 10% of that rule's weight is deducted
- Uses existing RuleLevel enum weights: ERROR=3, WARNING=2, NOTICE=1
- Overall site score calculated as percentage (0-100) based on total possible points vs. points earned
- **Implementation**: `calculateProportionalScore()` in `src/lib/evaluate.ts`

### 4. Site-Wide Rules

Added support for site-level checks that run once per audit:

#### New Site Rules

1. **hasRobotsTxt** - Checks for robots.txt presence (WARNING level)

   - Location: `src/rules/hasRobotsTxt.rule.ts`

2. **hasSitemapXml** - Checks for sitemap.xml presence (WARNING level)

   - Location: `src/rules/hasSitemapXml.rule.ts`

3. **sitemapComplete** - Validates sitemap completeness (NOTICE level)
   - Checks if all crawled pages are listed in sitemap
   - Location: `src/rules/sitemapComplete.rule.ts`

- **Type Support**: Added `SiteRule` and `SiteRuleContext` types in `src/types/rules.ts`
- **Evaluation**: Added `evaluateSiteRules()` function in `src/lib/evaluate.ts`

### 5. New Page-Level SEO Rules

#### Implemented Rules

1. **hasHTTPS** - Verifies HTTPS encryption is used (ERROR level)

   - Location: `src/rules/hasHTTPS.rule.ts`

2. **hasMixedContent** - Detects HTTP resources on HTTPS pages (WARNING level)

   - Checks images, scripts, and stylesheets
   - Location: `src/rules/hasMixedContent.rule.ts`

3. **has4xxErrors** - Identifies client error status codes (ERROR level)

   - Location: `src/rules/has4xxErrors.rule.ts`

4. **has5xxErrors** - Identifies server error status codes (ERROR level)

   - Location: `src/rules/has5xxErrors.rule.ts`

5. **hasRedirectLoops** - Detects circular redirects (ERROR level)

   - Location: `src/rules/hasRedirectLoops.rule.ts`

6. **titleTooLong** - Checks if title exceeds 60 characters (WARNING level)

   - Location: `src/rules/titleTooLong.rule.ts`

7. **hasMetaDescription** - Enhanced existing rule for missing descriptions
   - Already existed, now integrated with new system

### 6. Crawler Behavior

- **No Sitemap Fallback**: If no sitemap.xml exists, crawler defaults to crawling from homepage only
- **Status Code Tracking**: Crawler now captures HTTP status codes for each page
- **Error Handling**: Improved failed request handling to track errors properly
- **Implementation**: Updated `src/crawler/audit.crawler.ts`

### 7. Enhanced Timer Functionality

Added new methods to Timer class:

- `getFormattedRuntime()`: Returns runtime in HH:MM:SS:MS format
- `getStartTime()`: Returns ISO timestamp for start time
- `getCurrentTime()`: Returns ISO timestamp for current time
- **Location**: `src/lib/timer.ts`

## File Structure

### New Files Created

- `src/types/audit.ts` - Output format types and audit metadata
- `src/prompts/outputFormat.prompt.ts` - Output format selection prompt
- `src/lib/formatters.ts` - Output formatting functions
- `src/rules/hasHTTPS.rule.ts`
- `src/rules/hasMixedContent.rule.ts`
- `src/rules/has4xxErrors.rule.ts`
- `src/rules/has5xxErrors.rule.ts`
- `src/rules/hasRedirectLoops.rule.ts`
- `src/rules/titleTooLong.rule.ts`
- `src/rules/hasRobotsTxt.rule.ts`
- `src/rules/hasSitemapXml.rule.ts`
- `src/rules/sitemapComplete.rule.ts`

### Modified Files

- `src/cmd/audit.ts` - Main audit command with all new features
- `src/types/rules.ts` - Added SiteRule and SiteRuleContext types
- `src/types/scrape.ts` - Added statusCode and redirectChain fields
- `src/lib/evaluate.ts` - Added site rule evaluation and proportional scoring
- `src/lib/timer.ts` - Added formatting methods
- `src/crawler/audit.crawler.ts` - Enhanced error handling and status tracking
- `src/rules/rules.ts` - Added all new rule definitions
- `package.json` - Fixed build script (removed conflicting tsc package)

## Usage

Run the enhanced audit tool:

```bash
pnpm run dev:audit
```

The tool will now:

1. Prompt for website URL
2. **Ask for output format** (By Page or By Rule)
3. Ask if Lighthouse audit should be run
4. Crawl the website (using sitemap if available, otherwise from homepage)
5. Evaluate all page-level and site-level rules
6. Calculate proportional score
7. Output formatted results in the selected format

## Testing Recommendations

To ensure all features work correctly:

1. Test with a website that has a sitemap.xml
2. Test with a website without a sitemap.xml
3. Test both output formats (By Page and By Rule)
4. Verify proportional scoring with sites that have partial failures
5. Test all new SEO rules individually
6. Verify site-level rules execute correctly

## Notes

- All new rules follow the existing modular architecture
- The scoring system is fully proportional and fair
- Site-level rules are evaluated once per audit
- Page-level rules are evaluated for each crawled page
- The tool maintains backward compatibility with existing functionality
