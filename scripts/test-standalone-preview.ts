// Test the standalone preview endpoint
async function testStandalonePreview() {
  const url = "http://localhost:3000/templates/preview-standalone/cmj30s44w0001ky04iwue3rmo";

  console.log(`Testing standalone preview: ${url}\n`);

  try {
    const response = await fetch(url);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get("content-type")}\n`);

    const text = await response.text();
    console.log(`Response length: ${text.length} chars`);
    console.log(`First 500 chars:\n${text.substring(0, 500)}`);
  } catch (error) {
    console.error("Fetch Error:", error);
  }
}

testStandalonePreview();
