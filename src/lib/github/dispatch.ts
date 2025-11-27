const GITHUB_API = "https://api.github.com";
const REPO =
  process.env.GITHUB_REPO || process.env.GITHUB_REPOSITORY || "dextasynergyservices/foreverpages";

export async function dispatchTemplateBuild(
  templateId: string,
  packageUrl: string,
  callbackUrl: string
) {
  const TEMPLATE_TOKEN = process.env.TEMPLATE_GITHUB_TOKEN;
  const FALLBACK_TOKEN = process.env.GITHUB_TOKEN;
  const TOKEN = TEMPLATE_TOKEN || FALLBACK_TOKEN;
  if (!TOKEN) throw new Error("TEMPLATE_GITHUB_TOKEN or GITHUB_TOKEN not configured");
  if (process.env.NODE_ENV === "production" && !TEMPLATE_TOKEN) {
    throw new Error(
      "In production, a dedicated TEMPLATE_GITHUB_TOKEN is required for dispatching template builds."
    );
  }
  const url = `${GITHUB_API}/repos/${REPO}/dispatches`;
  const body = {
    event_type: "template-build",
    client_payload: {
      templateId,
      packageUrl,
      callbackUrl,
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to dispatch build: ${res.status} ${text}`);
  }
  return true;
}
