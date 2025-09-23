export type SeoRule = {
  name: string;
  weight: number;
  check: (page: any) => Promise<{ success: boolean; message?: string }>;
};

// Example rules
export const titleRule: SeoRule = {
  name: "Title Tag",
  weight: 3,
  check: async (page) => {
    const title = await page.title();
    if (title && title.length > 0) {
      return { success: true };
    } else {
      return { success: false, message: "Missing title tag" };
    }
  },
};

export const metaDescriptionRule: SeoRule = {
  name: "Meta Description",
  weight: 2,
  check: async (page) => {
    const description = await page
      .$eval('meta[name="description"]', (el) => el.getAttribute("content"))
      .catch(() => null);

    if (description) return { success: true };
    return { success: false, message: "Missing meta description" };
  },
};
