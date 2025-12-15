async function main() {
  try {
    const templateId = "cmj30s44w0001ky04iwue3rmo";
    const apiUrl = `http://localhost:3000/api/templates/${templateId}/html`;

    console.log(`Fetching template HTML from: ${apiUrl}\n`);

    const response = await fetch(apiUrl);

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get("content-type")}\n`);

    if (!response.ok) {
      console.error("Failed to fetch template HTML");
      return;
    }

    const html = await response.text();

    console.log(`HTML Length: ${html.length} characters\n`);
    console.log("First 500 characters:");
    console.log("=".repeat(80));
    console.log(html.substring(0, 500));
    console.log("=".repeat(80));
    console.log("\nLast 500 characters:");
    console.log("=".repeat(80));
    console.log(html.substring(Math.max(0, html.length - 500)));
    console.log("=".repeat(80));

    // Check for common issues
    console.log("\n🔍 Checking for potential issues:");

    if (!html.includes("<!DOCTYPE") && !html.includes("<html")) {
      console.log("❌ No HTML structure found!");
    } else {
      console.log("✅ HTML structure present");
    }

    if (!html.includes("<body")) {
      console.log("❌ No <body> tag found!");
    } else {
      console.log("✅ <body> tag present");
    }

    const stylesheetMatches = html.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/g);
    console.log(`📄 Stylesheets found: ${stylesheetMatches?.length || 0}`);

    const scriptMatches = html.match(/<script[^>]*>/g);
    console.log(`📜 Script tags found: ${scriptMatches?.length || 0}`);

    // Check if assets are absolute URLs
    const hasRelativePaths = html.match(/(?:src|href)=["'](?!http|data:)[^"']*["']/);
    if (hasRelativePaths) {
      console.log("⚠️  Warning: Relative paths detected!");
      console.log("   Example:", hasRelativePaths[0]);
    } else {
      console.log("✅ All asset paths appear to be absolute");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
