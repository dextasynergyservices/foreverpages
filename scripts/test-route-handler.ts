// Test if the route is responding
async function testRoute() {
  const url = "http://localhost:3000/templates/preview/cmj30s44w0001ky04iwue3rmo";

  console.log(`Testing route: ${url}\n`);

  try {
    const response = await fetch(url);
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get("content-type")}`);

    const text = await response.text();
    console.log(`Response length: ${text.length} chars\n`);

    if (text.includes("404") || text.includes("Page Not Found")) {
      console.log("❌ Getting 404 - route handler not being called");
      console.log("First 500 chars:", text.substring(0, 500));
    } else if (text.includes("cloudinary")) {
      console.log("✅ Template HTML is being served!");
    } else if (text.includes("Internal server error")) {
      console.log("❌ Internal server error in route handler");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testRoute();
