import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchTemplateBuild } from "@/lib/github/dispatch";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes timeout

/**
 * This endpoint handles the complete template processing flow:
 * 1. Dispatch GitHub build
 * 2. Wait for build to complete
 * 3. Download artifact and create PR
 *
 * Called as a background job after upload
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const templateId = params?.id;
  if (!templateId) return NextResponse.json({ error: "Missing template id" }, { status: 400 });

  try {
    console.log(`[process-pr] Starting template processing for ${templateId}`);

    const tpl = await prisma.template.findUnique({ where: { id: templateId } });
    if (!tpl) return NextResponse.json({ error: "Template not found" }, { status: 404 });
    if (!tpl.packageUrl)
      return NextResponse.json({ error: "No package URL available" }, { status: 400 });

    // Step 1: Dispatch GitHub build
    console.log(`[process-pr] Dispatching GitHub build for ${templateId}`);
    const callbackUrl =
      process.env.TEMPLATE_BUILD_CALLBACK_URL ||
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/admin/templates/${templateId}/build-callback`;

    try {
      await dispatchTemplateBuild(templateId, tpl.packageUrl, callbackUrl);
    } catch (e) {
      console.error(`[process-pr] Failed to dispatch build for ${templateId}:`, e);
      await prisma.template.update({
        where: { id: templateId },
        data: {
          processingStatus: "ERROR",
          processingLogs: `Failed to dispatch build: ${e instanceof Error ? e.message : String(e)}`,
        },
      });
      return NextResponse.json({ error: "Failed to dispatch build" }, { status: 500 });
    }

    // Step 2: Poll for build completion + create PR
    // This runs asynchronously after returning to client
    runProcessingInBackground(templateId);

    return NextResponse.json({ message: "Processing started" });
  } catch (e) {
    console.error(`[process-pr] Error:`, e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Processing error" },
      { status: 500 }
    );
  }
}

/**
 * Background job to wait for build and create PR
 */
async function runProcessingInBackground(templateId: string) {
  try {
    console.log(`[process-pr-bg] Starting background processing for ${templateId}`);

    // Poll for GitHub Actions completion (max 10 minutes)
    const maxWaitTime = 10 * 60 * 1000; // 10 minutes
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    let buildComplete = false;
    let buildSuccess = false;

    while (Date.now() - startTime < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      // Check if callback has already updated prUrl (indicating success)
      const current = await prisma.template.findUnique({
        where: { id: templateId },
        select: { prUrl: true, processingStatus: true },
      });

      if (current?.prUrl) {
        console.log(`[process-pr-bg] PR already created for ${templateId}: ${current.prUrl}`);
        buildComplete = true;
        buildSuccess = true;
        break;
      }

      if (current?.processingStatus === "ERROR") {
        console.log(`[process-pr-bg] Template marked ERROR for ${templateId}`);
        buildComplete = true;
        break;
      }

      console.log(`[process-pr-bg] Waiting for build completion... (${Date.now() - startTime}ms)`);
    }

    if (!buildComplete) {
      console.warn(`[process-pr-bg] Build did not complete within timeout for ${templateId}`);
      await prisma.template.update({
        where: { id: templateId },
        data: {
          processingStatus: "ERROR",
          processingLogs: "Build processing timeout",
        },
      });
      return;
    }

    if (!buildSuccess) {
      // Callback should have already set ERROR status, nothing to do
      console.log(`[process-pr-bg] Build failed or no PR created for ${templateId}`);
      return;
    }

    console.log(`[process-pr-bg] ✓ Processing complete for ${templateId}`);
  } catch (e) {
    console.error(`[process-pr-bg] Background error for ${templateId}:`, e);
    try {
      await prisma.template.update({
        where: { id: templateId },
        data: {
          processingStatus: "ERROR",
          processingLogs: `Background processing error: ${e instanceof Error ? e.message : String(e)}`,
        },
      });
    } catch (updateErr) {
      console.error(`[process-pr-bg] Failed to update template after error:`, updateErr);
    }
  }
}
