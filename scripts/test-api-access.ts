// Test if the API route is accessible
async function testAPI() {
  const templateId = "cmj30s44w0001ky04iwue3rmo";
  const url = `http://localhost:3000/api/templates/${templateId}/html`;

  console.log(`Testing: ${url}\n`);

  try {
    const response = await fetch(url);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get("content-type")}`);

    const text = await response.text();
    console.log(`\nResponse length: ${text.length} chars`);
    console.log(`\nFirst 200 chars:\n${text.substring(0, 200)}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

testAPI();
