#!/usr/bin/env node
/*
Phase 3 E2E test script

Environment required:
  GITHUB_TOKEN - token with repo access
  GITHUB_REPOSITORY - owner/repo (optional; fallback to env in script)
  GITHUB_WEBHOOK_SECRET - secret used by webhook
  WEBHOOK_URL - URL to your webhook endpoint (default http://localhost:3000/api/github/webhooks/pulls)

Run: node scripts/phase3-e2e-test.js
*/
/* eslint-disable */
const crypto = require("crypto");
// prefer global fetch (node18+). If not present, use undici (CJS compatible)
let fetchFn;
if (typeof fetch !== "undefined") fetchFn = fetch.bind(globalThis);
else {
  try {
    fetchFn = require("undici").fetch;
  } catch {
    console.error(
      "No global fetch and 'undici' not installed. Please install undici or run on Node 18+."
    );
    process.exit(1);
  }
}

// Use generated Prisma client directly to avoid package init issues
const GeneratedPrisma = require("../src/generated/prisma/index.js");
const { PrismaClient } = GeneratedPrisma;
const prisma = new PrismaClient();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY || process.env.GITHUB_REPO;
const WEBHOOK_URL = process.env.WEBHOOK_URL || "http://localhost:3000/api/github/webhooks/pulls";
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

if (!GITHUB_TOKEN) {
  console.error("GITHUB_TOKEN required");
  process.exit(1);
}
if (!REPO) {
  console.error("GITHUB_REPOSITORY (owner/repo) required");
  process.exit(1);
}
if (!WEBHOOK_SECRET) {
  console.error("GITHUB_WEBHOOK_SECRET required");
  process.exit(1);
}

async function ghFetch(path, opts = {}) {
  const url = `https://api.github.com/repos/${REPO}${path}`;
  const res = await fetchFn(url, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" },
    ...opts,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub ${res.status} ${txt}`);
  }
  // Some GitHub endpoints (DELETE) may return an empty body — handle that gracefully
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function signPayload(payload) {
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET).update(payload).digest("hex");
  return `sha256=${hmac}`;
}

async function run() {
  const id = crypto.randomBytes(6).toString("hex");
  const templateId = `e2e-${id}`;
  console.log("Creating Template DB row id=", templateId);
  await prisma.template.create({
    data: {
      id: templateId,
      name: `E2E Template ${id}`,
      slug: `e2e-${id}`,
      previewImage: "",
      thumbnailImage: "",
      componentPath: "",
      processingStatus: "PROCESSING",
    },
  });

  // Create PR via GitHub low-level API (create a tiny file)
  console.log("Creating branch and opening PR...");
  const baseRef = await ghFetch("/git/ref/heads/develop");
  const baseSha = baseRef.object.sha;

  const content = `E2E test file for template ${templateId}`;
  const blob = await ghFetch("/git/blobs", {
    method: "POST",
    body: JSON.stringify({ content: Buffer.from(content).toString("base64"), encoding: "base64" }),
  });

  const tree = await ghFetch("/git/trees", {
    method: "POST",
    body: JSON.stringify({
      base_tree: baseSha,
      tree: [
        { path: `templates/${templateId}/E2E.txt`, mode: "100644", type: "blob", sha: blob.sha },
      ],
    }),
  });

  const commit = await ghFetch("/git/commits", {
    method: "POST",
    body: JSON.stringify({
      message: `E2E test commit ${templateId}`,
      tree: tree.sha,
      parents: [baseSha],
    }),
  });

  const branchName = `template/e2e-${templateId}`;
  await ghFetch("/git/refs", {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: commit.sha }),
  });

  const pr = await ghFetch("/pulls", {
    method: "POST",
    body: JSON.stringify({
      title: `E2E PR ${templateId}`,
      head: branchName,
      base: "develop",
      body: "E2E test PR",
    }),
  });
  console.log("PR created:", pr.html_url);

  // Send signed webhook to local server
  const payload = JSON.stringify({
    action: "opened",
    pull_request: {
      number: pr.number,
      html_url: pr.html_url,
      head: { ref: branchName },
      state: "open",
      merged: false,
    },
  });
  const sig = signPayload(payload);

  console.log("Sending signed webhook to", WEBHOOK_URL);
  const webhookRes = await fetch(WEBHOOK_URL, {
    method: "POST",
    body: payload,
    headers: {
      "content-type": "application/json",
      "x-hub-signature-256": sig,
      "x-github-event": "pull_request",
    },
  });
  console.log("Webhook response:", webhookRes.status);

  // Wait a moment for webhook handler to update DB
  await new Promise((r) => setTimeout(r, 2000));

  const tpl = await prisma.template.findUnique({ where: { id: templateId } });
  console.log(
    "Template after webhook:",
    tpl
      ? { prNumber: tpl.prNumber, prUrl: tpl.prUrl, processingStatus: tpl.processingStatus }
      : null
  );

  // Merge the PR using GitHub API
  console.log("Merging PR", pr.number);
  const mergeRes = await ghFetch(`/pulls/${pr.number}/merge`, {
    method: "PUT",
    body: JSON.stringify({ merge_method: "merge" }),
  });
  console.log("Merge result:", mergeRes);

  // Update DB status to PUBLISHED to simulate admin merge flow
  await prisma.template.update({
    where: { id: templateId },
    data: { processingStatus: "PUBLISHED" },
  });

  const finalTpl = await prisma.template.findUnique({ where: { id: templateId } });
  console.log("Final template:", finalTpl ? { processingStatus: finalTpl.processingStatus } : null);

  // Cleanup: close PR (if not already closed/merged) and delete branch
  try {
    console.log("Cleaning up PR (closing)");
    await ghFetch(`/pulls/${pr.number}`, {
      method: "PATCH",
      body: JSON.stringify({ state: "closed" }),
    });
  } catch (e) {
    console.warn("Close PR failed (it may be merged):", String(e));
  }

  try {
    console.log("Deleting branch", branchName);
    await ghFetch(`/git/refs/heads/${branchName}`, { method: "DELETE" });
  } catch (e) {
    console.warn("Delete branch failed:", String(e));
  }

  console.log("E2E finished.");
}

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
