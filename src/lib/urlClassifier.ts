/**
 * URL Type Classification
 */
export enum UrlType {
  HTML_PAGE = "HTML_PAGE", // Regular HTML page
  PDF = "PDF", // PDF document
  DOC = "DOC", // Word document (.doc, .docx)
  OTHER_DOCUMENT = "OTHER_DOCUMENT", // Other document types
  UNKNOWN = "UNKNOWN", // Unknown type
}

/**
 * Document file extensions to exclude from page counting
 */
const DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
  ".zip",
  ".rar",
  ".tar",
  ".gz",
];

/**
 * PDF file extensions
 */
const PDF_EXTENSIONS = [".pdf"];

/**
 * Word document extensions
 */
const DOC_EXTENSIONS = [".doc", ".docx"];

/**
 * Classify a URL based on its extension
 *
 * @param {string} url - The URL to classify
 * @returns {UrlType} - The classified URL type
 */
export function classifyUrlByExtension(url: string): UrlType {
  const urlLower = url.toLowerCase();

  // Check for PDF
  if (PDF_EXTENSIONS.some((ext) => urlLower.endsWith(ext))) {
    return UrlType.PDF;
  }

  // Check for Word documents
  if (DOC_EXTENSIONS.some((ext) => urlLower.endsWith(ext))) {
    return UrlType.DOC;
  }

  // Check for other documents
  if (DOCUMENT_EXTENSIONS.some((ext) => urlLower.endsWith(ext))) {
    return UrlType.OTHER_DOCUMENT;
  }

  // Default to HTML page if no document extension found
  return UrlType.HTML_PAGE;
}

/**
 * Classify a URL based on content type header
 *
 * @param {string} contentType - The content-type header value
 * @returns {UrlType} - The classified URL type
 */
export function classifyUrlByContentType(contentType: string): UrlType {
  const contentTypeLower = contentType.toLowerCase();

  if (contentTypeLower.includes("application/pdf")) {
    return UrlType.PDF;
  }

  if (
    contentTypeLower.includes("application/msword") ||
    contentTypeLower.includes(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
  ) {
    return UrlType.DOC;
  }

  if (
    contentTypeLower.includes("application/") &&
    !contentTypeLower.includes("application/json") &&
    !contentTypeLower.includes("application/javascript")
  ) {
    return UrlType.OTHER_DOCUMENT;
  }

  if (contentTypeLower.includes("text/html")) {
    return UrlType.HTML_PAGE;
  }

  return UrlType.UNKNOWN;
}

/**
 * Determine if a URL type should be counted as a page for SEO analysis
 *
 * @param {UrlType} urlType - The URL type
 * @returns {boolean} - True if it should be counted as a page
 */
export function isHtmlPage(urlType: UrlType): boolean {
  return urlType === UrlType.HTML_PAGE;
}

/**
 * Determine if a URL type is a document (PDF, DOC, etc.)
 *
 * @param {UrlType} urlType - The URL type
 * @returns {boolean} - True if it's a document
 */
export function isDocument(urlType: UrlType): boolean {
  return (
    urlType === UrlType.PDF ||
    urlType === UrlType.DOC ||
    urlType === UrlType.OTHER_DOCUMENT
  );
}

/**
 * Get a human-readable description of the URL type
 *
 * @param {UrlType} urlType - The URL type
 * @returns {string} - Human-readable description
 */
export function getUrlTypeDescription(urlType: UrlType): string {
  switch (urlType) {
    case UrlType.HTML_PAGE:
      return "HTML Page";
    case UrlType.PDF:
      return "PDF Document";
    case UrlType.DOC:
      return "Word Document";
    case UrlType.OTHER_DOCUMENT:
      return "Other Document";
    case UrlType.UNKNOWN:
      return "Unknown Type";
    default:
      return "Unknown";
  }
}

