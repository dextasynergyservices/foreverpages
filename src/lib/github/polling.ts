/**
 * GitHub Actions polling utility
 *
 * Instead of relying on webhooks, we poll the GitHub API to check
 * if a template build has completed.
 */

const GITHUB_API = "https://api.github.com";
const REPO =
  process.env.GITHUB_REPO || process.env.GITHUB_REPOSITORY || "dextasynergyservices/foreverpages";

export interface GitHubRunStatus {
  runId: string | null;
  status: "queued" | "in_progress" | "completed" | "unknown";
  conclusion: "success" | "failure" | "cancelled" | null;
  url: string | null;
}

/**
 * Check the status of a GitHub Actions workflow run for a template
 * IMPORTANT: This should only be used as a fallback. The callback is the primary method.
 * Polling has race conditions and can't match specific template runs reliably.
 */
export async function checkTemplateBuildStatus(
  templateId: string,
  maxAgeSeconds: number = 600 // Look for runs in last 10 minutes
): Promise<GitHubRunStatus> {
  try {
    const token = process.env.TEMPLATE_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
    if (!token) {
      console.warn("[gh-polling] No GitHub token available for polling");
      return { runId: null, status: "unknown", conclusion: null, url: null };
    }

    console.log(
      `[gh-polling] WARNING: Using polling fallback for ${templateId} - this is less reliable than callback`
    );

    // Query recent template-build workflow runs
    const url = `${GITHUB_API}/repos/${REPO}/actions/runs?event=repository_dispatch&status=completed&per_page=50`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "foreverpages-template-processor",
      },
    });

    if (!response.ok) {
      console.warn(`[gh-polling] Failed to query GitHub API: ${response.status}`);
      return { runId: null, status: "unknown", conclusion: null, url: null };
    }

    const data = (await response.json()) as {
      workflow_runs?: Array<{
        id: number;
        status: string;
        conclusion: string | null;
        created_at: string;
        html_url: string;
        name: string;
      }>;
    };

    if (!data.workflow_runs || data.workflow_runs.length === 0) {
      console.log(`[gh-polling] No completed template builds found`);
      return { runId: null, status: "unknown", conclusion: null, url: null };
    }

    // Find the most recent completed run within time window
    // Note: We can't match to specific templateId from API, so this is unreliable
    const now = Date.now();
    const cutoff = now - maxAgeSeconds * 1000;

    for (const run of data.workflow_runs) {
      const runTime = new Date(run.created_at).getTime();
      if (runTime >= cutoff && run.name === "Build Template") {
        console.log(
          `[gh-polling] Found recent completed run: ${run.id} (conclusion: ${run.conclusion})`
        );
        console.log(
          `[gh-polling] WARNING: Cannot verify if run ${run.id} matches templateId ${templateId}`
        );

        return {
          runId: String(run.id),
          status: (run.status as GitHubRunStatus["status"]) || "unknown",
          conclusion: (run.conclusion as GitHubRunStatus["conclusion"]) || null,
          url: run.html_url,
        };
      }
    }

    console.log(`[gh-polling] No matching runs found within ${maxAgeSeconds}s window`);
    return { runId: null, status: "unknown", conclusion: null, url: null };
  } catch (e) {
    console.error("[gh-polling] Error checking GitHub status:", e);
    return { runId: null, status: "unknown", conclusion: null, url: null };
  }
}

/**
 * Poll GitHub until build completes
 */
export async function pollUntilBuildComplete(
  templateId: string,
  maxWaitSeconds: number = 600, // 10 minutes
  pollIntervalSeconds: number = 10
): Promise<boolean> {
  console.log(`[gh-polling] Starting poll for ${templateId} (max ${maxWaitSeconds}s)`);

  const startTime = Date.now();
  const maxWaitMs = maxWaitSeconds * 1000;
  const pollIntervalMs = pollIntervalSeconds * 1000;

  while (Date.now() - startTime < maxWaitMs) {
    const status = await checkTemplateBuildStatus(templateId);

    if (status.status === "completed") {
      const success = status.conclusion === "success";
      console.log(
        `[gh-polling] Build completed for ${templateId}: ${status.conclusion} (${status.url})`
      );
      return success;
    }

    console.log(
      `[gh-polling] Build still running for ${templateId}, waiting ${pollIntervalSeconds}s...`
    );
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  console.warn(`[gh-polling] Poll timeout for ${templateId} after ${maxWaitSeconds}s`);
  return false;
}
