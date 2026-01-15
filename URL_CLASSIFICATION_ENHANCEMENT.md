# URL Classification & Enhanced Metadata Enhancement

## Overview

This enhancement adds intelligent URL classification and detailed metadata tracking to the SEO audit tool. The system now distinguishes between HTML pages and documents (PDFs, Word docs, etc.), providing more accurate SEO analysis and reporting.

## Key Features

### 1. URL Type Classification

The crawler now classifies URLs into different types:

- **HTML_PAGE**: Regular HTML pages (evaluated for SEO)
- **PDF**: PDF documents (tracked but not evaluated)
- **DOC**: Word documents (.doc, .docx) (tracked but not evaluated)
- **OTHER_DOCUMENT**: Other document types (tracked but not evaluated)
- **UNKNOWN**: Unknown type

Classification is performed using:
1. **File extension detection** (primary method)
2. **Content-Type header analysis** (fallback method)

### 2. Enhanced Metadata

The audit now provides three distinct URL/page counts:

```json
{
  "total_urls": 100,      // All URLs discovered (HTML + documents)
  "total_pages": 20,      // HTML pages only
  "indexed_pages": 10     // Pages likely indexed by search engines
}
```

### 3. Indexability Detection

The system determines if a page is likely indexed by search engines based on:

- **noindex directives**: Checks `<meta name="robots" content="noindex">` and `<meta name="googlebot">`
- **HTTP status codes**: 4xx and 5xx errors are not indexable
- **Success criteria**: Only 2xx and 3xx status codes with no noindex directive

### 4. Intelligent SEO Evaluation

- **HTML pages**: Full SEO rule evaluation
- **Documents (PDFs, DOCs)**: Skipped from SEO evaluation but tracked in metadata
- **Proportional scoring**: Only HTML pages affect the overall SEO score

## Files Created

### 1. `src/lib/urlClassifier.ts`
Provides URL classification utilities:
- `classifyUrlByExtension()`: Classify by file extension
- `classifyUrlByContentType()`: Classify by Content-Type header
- `isHtmlPage()`: Check if URL is an HTML page
- `isDocument()`: Check if URL is a document
- `getUrlTypeDescription()`: Get human-readable type description

### 2. `src/lib/indexability.ts`
Provides indexability detection:
- `hasNoIndexDirective()`: Detect noindex meta tags
- `isPageIndexable()`: Determine if page is likely indexed
- `getIndexabilityStatus()`: Get detailed indexability status

## Files Modified

### 1. `src/types/audit.ts`
Added new fields to `AuditMeta`:
```typescript
export type AuditMeta = {
  runtime: string;
  start: string;
  end: string;
  status: AuditStatus;
  total_urls: number;      // NEW
  total_pages: number;     // NEW
  indexed_pages: number;   // NEW
};
```

### 2. `src/types/scrape.ts`
Enhanced `ScrapedData` with classification fields:
```typescript
type SuccessScrapedData = {
  url: string;
  linksFound: string[];
  seoReport: SEOReport;
  statusCode?: number;
  redirectChain?: string[];
  urlType: UrlType;        // NEW
  isIndexable: boolean;    // NEW
  hasNoIndex: boolean;     // NEW
};
```

### 3. `src/crawler/audit.crawler.ts`
Enhanced crawler to:
- Classify URLs before processing
- Skip SEO evaluation for documents
- Detect noindex directives
- Calculate indexability status
- Only enqueue links from HTML pages

### 4. `src/cmd/audit.ts`
Updated main audit flow to:
- Calculate total URLs, HTML pages, and indexed pages
- Filter to only HTML pages for SEO evaluation
- Display detailed URL/page counts in console output
- Include new metadata in audit results

## Console Output Example

```
✅ Discovered 45 total URL(s)
   - 30 HTML page(s)
   - 25 indexable page(s)
   - 15 document(s) (PDFs, DOCs, etc.)

📊 SEO Audit Results for https://example.com
============================================================
Overall Score: 85/100
Total URLs Discovered: 45
HTML Pages: 30
Indexable Pages: 25
Format: By Page
============================================================
```

## JSON Output Example

Both "By Page" and "By Rule" formats now include:

```json
{
  "site": "https://example.com",
  "meta": {
    "runtime": "00:02:15:45",
    "start": "2026-01-15T10:30:00.000Z",
    "end": "2026-01-15T10:32:15.045Z",
    "status": "SUCCESS",
    "total_urls": 45,
    "total_pages": 30,
    "indexed_pages": 25
  },
  "overall_score": 85,
  "pages": [...]
}
```

## Benefits

1. **More Accurate Reporting**: Distinguishes between discoverable URLs and actual web pages
2. **Better SEO Insights**: Identifies which pages are likely indexed by search engines
3. **Efficient Processing**: Skips unnecessary SEO evaluation for documents
4. **Detailed Metrics**: Provides comprehensive URL/page statistics
5. **Proportional Scoring**: Only HTML pages affect the overall SEO score

## Technical Details

### Document Extensions Excluded
- `.pdf`, `.doc`, `.docx`
- `.xls`, `.xlsx`, `.ppt`, `.pptx`
- `.txt`, `.csv`
- `.zip`, `.rar`, `.tar`, `.gz`

### Indexability Criteria
A page is considered indexable if:
- ✅ HTTP status code is 2xx or 3xx
- ✅ No `noindex` directive in meta robots tag
- ✅ No `noindex` directive in googlebot meta tag

A page is NOT indexable if:
- ❌ Has `noindex` directive
- ❌ HTTP status code is 4xx (client error)
- ❌ HTTP status code is 5xx (server error)
- ❌ No status code available

## Backward Compatibility

- All existing functionality remains intact
- Existing output formats automatically include new metadata fields
- No breaking changes to the API or command-line interface

