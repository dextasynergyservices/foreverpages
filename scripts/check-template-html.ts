// Check what's in the template HTML
async function checkTemplateHTML() {
  const url = "http://localhost:3000/templates/preview/cmj30s44w0001ky04iwue3rmo";

  console.log(`Fetching template HTML...\n`);

  try {
    const response = await fetch(url);
    const html = await response.text();

    console.log(`Length: ${html.length} chars\n`);

    // Check for base tag
    if (html.includes("<base")) {
      console.log("✅ Has <base> tag");
      const baseMatch = html.match(/<base[^>]*>/i);
      if (baseMatch) console.log("   ", baseMatch[0]);
    } else {
      console.log("❌ No <base> tag");
    }

    // Check for React Router
    if (html.includes("react-router") || html.includes("React Router")) {
      console.log("✅ Contains React Router references");
    }

    // Check for script tags
    const scriptMatches = html.match(/<script[^>]*src="([^"]+)"/gi);
    if (scriptMatches) {
      console.log(`\n📦 Found ${scriptMatches.length} script tags:`);
      scriptMatches.slice(0, 3).forEach((tag) => console.log("   ", tag));
    }

    // Show the full HTML
    console.log("\n📄 Full HTML:\n");
    console.log(html);
  } catch (error) {
    console.error("Error:", error);
  }
}

checkTemplateHTML();
