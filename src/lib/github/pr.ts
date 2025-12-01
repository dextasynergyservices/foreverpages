const GITHUB_API = "https://api.github.com";
const REPO =
  process.env.GITHUB_REPO || process.env.GITHUB_REPOSITORY || "dextasynergyservices/foreverpages";

async function ghFetch(path: string, opts: RequestInit = {}) {
  // Prefer a dedicated token for template operations to limit blast radius.
  // `GITHUB_TEMPLATE_TOKEN` should be used in production; fall back to
  // `GITHUB_TOKEN` for convenience in development.
  const TEMPLATE_TOKEN = process.env.TEMPLATE_GITHUB_TOKEN;
  const FALLBACK_TOKEN = process.env.GITHUB_TOKEN;
  const TOKEN = TEMPLATE_TOKEN || FALLBACK_TOKEN;
  if (!TOKEN) throw new Error("TEMPLATE_GITHUB_TOKEN or GITHUB_TOKEN not configured");

  // Enforce policy: in production, require an explicit template token.
  if (process.env.NODE_ENV === "production" && !TEMPLATE_TOKEN) {
    throw new Error(
      "In production, a dedicated TEMPLATE_GITHUB_TOKEN is required for template operations — do not use a broad GITHUB_TOKEN."
    );
  }
  const url = `${GITHUB_API}/repos/${REPO}${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github+json" },
    ...opts,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub API ${res.status} ${txt}`);
  }
  return res.json();
}

type FileSpec = { path: string; content: string | Buffer };

export async function createPrForTemplate(
  branchName: string,
  files: FileSpec[],
  title: string,
  body: string,
  base = "develop"
) {
  // 1) Get reference for base branch
  const baseRef = await ghFetch(`/git/ref/heads/${base}`);
  const baseSha = baseRef.object.sha;

  // 2) Create blobs
  const blobs = await Promise.all(
    files.map((f) =>
      ghFetch(`/git/blobs`, {
        method: "POST",
        body: JSON.stringify({
          content: Buffer.from(f.content).toString("base64"),
          encoding: "base64",
        }),
      })
    )
  );

  // 3) Create tree
  const tree = await ghFetch(`/git/trees`, {
    method: "POST",
    body: JSON.stringify({
      base_tree: baseSha,
      tree: files.map((f, i) => ({
        path: f.path,
        mode: "100644",
        type: "blob",
        sha: blobs[i].sha,
      })),
    }),
  });

  // 4) Create commit
  const commit = await ghFetch(`/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message: title, tree: tree.sha, parents: [baseSha] }),
  });

  // 5) Create ref for new branch
  await ghFetch(`/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: commit.sha }),
  });

  // 6) Open pull request
  const pr = await ghFetch(`/pulls`, {
    method: "POST",
    body: JSON.stringify({ title, head: branchName, base, body }),
  });

  return { number: pr.number, url: pr.html_url };
}

export async function mergePr(
  prNumber: number,
  mergeMethod: "merge" | "squash" | "rebase" = "merge"
) {
  const res = await ghFetch(`/pulls/${prNumber}/merge`, {
    method: "PUT",
    body: JSON.stringify({ merge_method: mergeMethod }),
  });
  return res;
}
