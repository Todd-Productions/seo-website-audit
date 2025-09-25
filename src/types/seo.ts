type SEOResult = {
  success: boolean;
  message?: string;
  rule: string;
};

type SEOReport = {
  results: SEOResult[];
  score: number;
};

export { type SEOReport, type SEOResult };
