// Script to generate translation files for all languages
// This is a helper script to create the structure for all languages

import fs from "fs";
import path from "path";

// Read the English translation file as the base
const enTranslations = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../src/lib/locales/en.json"), "utf8")
);

// Language-specific translations (you can expand these)
const translations = {
  fr: {
    // French translations will be added here
    // For now, we'll use placeholder text
  },
  es: {
    // Spanish translations will be added here
  },
  yo: {
    // Yoruba translations will be added here
  },
  ig: {
    // Igbo translations will be added here
  },
  ha: {
    // Hausa translations will be added here
  },
};

// Generate files for each language
Object.keys(translations).forEach((lang) => {
  const filePath = path.join(__dirname, `../src/lib/locales/${lang}.json`);

  // For now, just copy the English structure
  // In a real scenario, you would replace this with actual translations
  fs.writeFileSync(filePath, JSON.stringify(enTranslations, null, 2));
  console.log(`Generated ${lang}.json`);
});

console.log("Translation files generated successfully!");
