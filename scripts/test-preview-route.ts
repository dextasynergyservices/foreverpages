// Test what's actually being served
async function testPreview() {
  const url = "http://localhost:3000/templates/preview/cmj30s44w0001ky04iwue3rmo";

  console.log(`Testing: ${url}\n`);

  try {
    const response = await fetch(url);
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get("content-type")}\n`);

    const html = await response.text();
    console.log(`Response length: ${html.length} chars`);

    // Check if it's the template HTML or Next.js page
    if (html.includes("<!DOCTYPE html>")) {
      console.log("✅ HTML document returned");

      // Check if it's the template (Cloudinary assets) or Next.js page
      if (html.includes("cloudinary")) {
        console.log("✅ Contains Cloudinary URLs - template HTML served!");
      } else if (html.includes("_next") || html.includes("__next")) {
        console.log("❌ Contains Next.js - serving page.tsx instead of route.ts");
      }

      // Check for React Router
      if (html.includes("React Router") || html.includes("react-router")) {
        console.log("✅ Contains React Router");
      }

      // Show first 300 chars of body
      const bodyMatch = html.match(/<body[^>]*>([\s\S]{0,300})/i);
      if (bodyMatch) {
        console.log("\nFirst 300 chars of body:");
        console.log(bodyMatch[1]);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testPreview();
