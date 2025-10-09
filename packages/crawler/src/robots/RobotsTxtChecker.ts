export interface RobotCheck {
  allowed: boolean;
  reason?: string;
  sitemapUrls: string[];
}

interface RobotRules {
  disallow: string[];
  allow: string[];
  sitemaps: string[];
}

export class RobotsTxtChecker {
  private cache: Map<string, RobotRules> = new Map();

  async checkUrl(
    url: string,
    userAgent = "site-generator-bot",
  ): Promise<RobotCheck> {
    try {
      const urlObj = new URL(url);
      const domain = `${urlObj.protocol}//${urlObj.hostname}`;

      // Get or fetch rules
      let rules = this.cache.get(domain);
      if (!rules) {
        rules = await this.fetchRobotsTxt(domain, userAgent);
        this.cache.set(domain, rules);
      }

      // Check if URL is disallowed
      const path = urlObj.pathname;
      const isDisallowed = rules.disallow.some((pattern) =>
        this.matchesPattern(path, pattern),
      );
      const isAllowed = rules.allow.some((pattern) =>
        this.matchesPattern(path, pattern),
      );

      // Allow takes precedence over disallow
      if (isAllowed) {
        return { allowed: true, sitemapUrls: rules.sitemaps };
      }

      if (isDisallowed) {
        return {
          allowed: false,
          reason: "Blocked by robots.txt",
          sitemapUrls: rules.sitemaps,
        };
      }

      return { allowed: true, sitemapUrls: rules.sitemaps };
    } catch (error) {
      // On error, allow by default
      return { allowed: true, sitemapUrls: [] };
    }
  }

  private async fetchRobotsTxt(
    domain: string,
    userAgent: string,
  ): Promise<RobotRules> {
    const robotsUrl = `${domain}/robots.txt`;
    const rules: RobotRules = { disallow: [], allow: [], sitemaps: [] };

    try {
      const response = await fetch(robotsUrl, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return rules; // No robots.txt, allow all
      }

      const content = await response.text();
      this.parseRobotsTxt(content, userAgent, rules);
    } catch {
      // Error fetching, allow all
    }

    return rules;
  }

  private parseRobotsTxt(
    content: string,
    userAgent: string,
    rules: RobotRules,
  ): void {
    const lines = content.split("\n");
    let relevantSection = false;

    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();

      if (trimmed.startsWith("user-agent:")) {
        const agent = trimmed.split(":")[1].trim();
        relevantSection = agent === "*" || agent === userAgent.toLowerCase();
      } else if (relevantSection) {
        if (trimmed.startsWith("disallow:")) {
          const path = line.split(":").slice(1).join(":").trim();
          if (path) rules.disallow.push(path);
        } else if (trimmed.startsWith("allow:")) {
          const path = line.split(":").slice(1).join(":").trim();
          if (path) rules.allow.push(path);
        }
      }

      // Sitemap applies to all user-agents
      if (trimmed.startsWith("sitemap:")) {
        const sitemapUrl = line.split(":").slice(1).join(":").trim();
        if (sitemapUrl) rules.sitemaps.push(sitemapUrl);
      }
    }
  }

  private matchesPattern(path: string, pattern: string): boolean {
    // Convert robots.txt pattern to regex
    const regexPattern = pattern.replace(/\*/g, ".*").replace(/\?/g, ".");
    return new RegExp(`^${regexPattern}`).test(path);
  }
}
