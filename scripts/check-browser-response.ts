// Check actual browser response
async function checkBrowserResponse() {
  const url = "http://localhost:3000/templates/preview/cmj30s44w0001ky04iwue3rmo";

  console.log(`Checking: ${url}\n`);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log(`\nResponse length: ${text.length}`);
    console.log(`\nFirst 1000 chars:\n${text.substring(0, 1000)}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

checkBrowserResponse();
