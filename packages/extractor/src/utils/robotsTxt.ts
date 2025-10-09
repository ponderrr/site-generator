export async function checkRobotsTxt(
  url: string,
  userAgent = "site-generator-bot",
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const robotsUrl = new URL("/robots.txt", url).href;
    const response = await fetch(robotsUrl, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      // No robots.txt or error fetching it - allow by default
      return { allowed: true };
    }

    const content = await response.text();
    const rules = parseRobotsTxt(content, userAgent);

    const urlPath = new URL(url).pathname;
    const isDisallowed = rules.disallow.some((pattern) =>
      matchesPattern(urlPath, pattern),
    );

    if (isDisallowed) {
      return {
        allowed: false,
        reason: "Blocked by robots.txt",
      };
    }

    return { allowed: true };
  } catch (error) {
    // On error, allow by default
    return { allowed: true };
  }
}

function parseRobotsTxt(content: string, userAgent: string) {
  const lines = content.split("\n");
  let relevantSection = false;
  const rules = { disallow: [] as string[], allow: [] as string[] };

  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();

    if (trimmed.startsWith("user-agent:")) {
      const agent = trimmed.split(":")[1].trim();
      relevantSection = agent === "*" || agent === userAgent.toLowerCase();
    } else if (relevantSection) {
      if (trimmed.startsWith("disallow:")) {
        const path = trimmed.split(":")[1].trim();
        if (path) rules.disallow.push(path);
      } else if (trimmed.startsWith("allow:")) {
        const path = trimmed.split(":")[1].trim();
        if (path) rules.allow.push(path);
      }
    }
  }

  return rules;
}

function matchesPattern(path: string, pattern: string): boolean {
  // Simple wildcard matching
  const regexPattern = pattern.replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${regexPattern}`).test(path);
}
