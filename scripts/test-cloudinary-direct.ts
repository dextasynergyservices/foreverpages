// Test the Cloudinary URL directly
async function testDirectLoad() {
  const url =
    "https://res.cloudinary.com/dxoorukfj/raw/upload/v1765553224/templates/cmj30s44w0001ky04iwue3rmo/dist/index.html";

  console.log(`Fetching from Cloudinary: ${url}\n`);

  try {
    const response = await fetch(url);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get("content-type")}`);

    const html = await response.text();
    console.log(`\nHTML Length: ${html.length} chars`);
    console.log(`\nFirst 500 chars:\n${html.substring(0, 500)}`);

    // Check for React errors
    if (html.includes("error") || html.includes("Error")) {
      console.log("\n⚠️  Warning: Error text found in HTML");
    }

    // Check script tags
    const scriptMatches = html.match(/<script[^>]*src="([^"]+)"/g);
    if (scriptMatches) {
      console.log(`\nScript tags found: ${scriptMatches.length}`);
      scriptMatches.forEach((s) => console.log(`  - ${s}`));
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testDirectLoad();
