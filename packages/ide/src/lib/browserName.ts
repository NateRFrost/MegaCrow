/** Human-readable browser name for the Files panel. */
export function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) {
    return "Edge";
  }
  if (ua.includes("OPR/") || ua.includes("Opera")) {
    return "Opera";
  }
  if (ua.includes("Chrome/")) {
    return "Chrome";
  }
  if (ua.includes("Firefox/")) {
    return "Firefox";
  }
  if (ua.includes("Safari/") && !ua.includes("Chrome")) {
    return "Safari";
  }
  return "Browser";
}
