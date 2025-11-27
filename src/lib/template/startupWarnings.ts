export function runStartupChecks() {
  try {
    const isProd = process.env.NODE_ENV === "production";
    const token = process.env.TEMPLATE_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
    if (isProd && !process.env.TEMPLATE_GITHUB_TOKEN) {
      console.error(
        "[template-sandbox] ERROR: TEMPLATE_GITHUB_TOKEN is required in production. Set the secret and restart."
      );
    }

    if (isProd && process.env.TEMPLATE_ALLOW_LOCAL_PROCESSING !== "1") {
      console.info(
        "[template-sandbox] INFO: Local template processing is disabled in production. Set TEMPLATE_ALLOW_LOCAL_PROCESSING=1 to override (not recommended)."
      );
    }

    if (isProd && process.env.TEMPLATE_ALLOW_LOCAL_PARITY === "1") {
      console.warn(
        "[template-sandbox] WARNING: TEMPLATE_ALLOW_LOCAL_PARITY=1 is set on a production node; ensure this is intentional and temporary."
      );
    }

    // If not prod, give a helpful dev hint
    if (!isProd && !token) {
      console.info(
        "[template-sandbox] Hint: set TEMPLATE_GITHUB_TOKEN for testing remote dispatch behavior."
      );
    }
  } catch (e) {
    console.warn("[template-sandbox] startup checks failed", e);
  }
}
