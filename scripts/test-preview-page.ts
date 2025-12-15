// Test the preview page by fetching from it
async function testPreviewPage() {
  const url = "http://localhost:3000/templates/preview/cmj30s44w0001ky04iwue3rmo";

  console.log(`Testing preview page: ${url}\n`);

  try {
    const response = await fetch(url);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get("content-type")}\n`);

    const html = await response.text();
    console.log(`Response length: ${html.length} chars`);

    // Check what was returned
    if (html.includes("<!DOCTYPE html>") || html.includes("<!doctype html>")) {
      console.log("✅ Valid HTML document");

      // Check for React hydration errors
      if (html.includes("Hydration") || html.includes("hydration")) {
        console.log("⚠️  Possible hydration issue detected");
      }

      // Check what's in the body
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        console.log("\n📄 Body content (first 500 chars):");
        console.log(bodyMatch[1].substring(0, 500));
      }
    } else {
      console.log("❌ Not a valid HTML document");
      console.log("First 1000 chars:\n", html.substring(0, 1000));
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testPreviewPage();
