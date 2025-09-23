# SEO Website Audit Tool

This simple tool will help to audit SEO rules for a given website.

## Installation

```bash
pnpm install
pnpm exec playwright install # Possibly need to do this
```

## How It Works

1. Prompt the user for the URL of the website to audit
2. Clean The URL and ensure website is valid
3. Crawls to see how many pages the website has
4. Performs a series of checks to see if the website is SEO friendly
   1. Check if the website has a sitemap.xml
   2. Check if the website has a robots.txt file
   3. Check meta tags (title, description, keywords, canonical tag)
   4. Check for broken links
   5. Check for missing alt tags
   6. Performs a lighthouse audit
5. Generates a report of results (JSON) and performance score

## Prompt workflow

1. Prompt the user for the URL of the website to audit
2. See if website has HTTP or HTTPS (correct protocol)
3.
