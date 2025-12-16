// Check if the template endpoint is actually returning HTML or a 404
async function checkEndpoint() {
  const templateId = "cmj30s44w0001ky04iwue3rmo";
  const url = `http://localhost:3000/api/templates/${templateId}/html`;

  console.log(`Testing: ${url}\n`);

  try {
    const response = await fetch(url);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get("content-type")}\n`);

    const text = await response.text();

    // Check if it's a Next.js 404 page
    if (text.includes("This page could not be found") || text.includes("404")) {
      console.log("⚠️  Looks like a Next.js 404 page");
      console.log("First 500 chars:\n", text.substring(0, 500));
      return;
    }

    // Check if it's valid HTML with scripts
    if (text.includes("<!doctype html>") && text.includes("<script")) {
      console.log("✅ Valid HTML returned");
      console.log(`Length: ${text.length} chars`);

      // Check what the HTML contains
      if (text.includes("404") || text.includes("Page not found")) {
        console.log("⚠️  HTML contains 404 text - this might be from the template itself");
      }

      // Extract and show script tags
      const scripts = text.match(/<script[^>]*src="([^"]+)"/g);
      if (scripts) {
        console.log(`\nScript tags (${scripts.length}):`);
        scripts.forEach((s) => console.log("  ", s));
      }

      return;
    }

    console.log("❌ Unexpected response");
    console.log("First 1000 chars:\n", text.substring(0, 1000));
  } catch (error) {
    console.error("Error:", error);
  }
}

checkEndpoint();
