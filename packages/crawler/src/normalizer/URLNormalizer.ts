export const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "_ga",
  "_gl",
  "ref",
  "referrer",
];

export const SKIP_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".zip",
  ".rar",
  ".tar",
  ".gz",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".svg",
  ".webp",
  ".ico",
  ".mp4",
  ".avi",
  ".mov",
  ".wmv",
  ".mp3",
  ".wav",
  ".exe",
  ".dmg",
  ".pkg",
];

export const SKIP_PATTERNS = [
  "/admin",
  "/login",
  "/logout",
  "/signin",
  "/signout",
  "/register",
  "/signup",
  "/cart",
  "/checkout",
  "/api/",
  "/cdn-cgi/",
  "/wp-admin/",
  "/wp-login",
];

export class URLNormalizer {
  normalize(urlString: string): string | null {
    try {
      const url = new URL(urlString);

      // Remove hash fragment
      url.hash = "";

      // Convert to lowercase
      url.hostname = url.hostname.toLowerCase();
      url.pathname = url.pathname.toLowerCase();

      // Normalize trailing slash
      if (!url.pathname.endsWith("/") && !this.hasFileExtension(url.pathname)) {
        url.pathname += "/";
      }

      // Strip tracking parameters
      const params = new URLSearchParams(url.search);
      for (const trackingParam of TRACKING_PARAMS) {
        params.delete(trackingParam);
      }

      // Sort remaining parameters alphabetically
      const sortedParams = new URLSearchParams(
        Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b)),
      );
      url.search = sortedParams.toString();

      return url.href;
    } catch {
      return null;
    }
  }

  isSameDomain(url: string, baseUrl: string): boolean {
    try {
      const urlObj = new URL(url);
      const baseObj = new URL(baseUrl);
      return urlObj.hostname === baseObj.hostname;
    } catch {
      return false;
    }
  }

  shouldSkip(url: string): boolean {
    const urlLower = url.toLowerCase();

    // Check file extensions
    for (const ext of SKIP_EXTENSIONS) {
      if (urlLower.endsWith(ext)) {
        return true;
      }
    }

    // Check path patterns
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();

      for (const pattern of SKIP_PATTERNS) {
        if (pathname.includes(pattern)) {
          return true;
        }
      }
    } catch {
      return true; // Skip invalid URLs
    }

    return false;
  }

  private hasFileExtension(pathname: string): boolean {
    const lastSegment = pathname.split("/").pop() || "";
    return (
      lastSegment.includes(".") && lastSegment.split(".").pop()!.length <= 5
    );
  }
}
