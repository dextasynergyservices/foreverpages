import { cleanupOldExtractions } from "../src/server/cleanup/cleanupExtracts";

(async function main() {
  try {
    console.log("Starting cleanupOldExtractions (7 days)");
    await cleanupOldExtractions(7);
    console.log("Cleanup completed");
    process.exit(0);
  } catch (err) {
    console.error("Cleanup failed", err);
    process.exit(1);
  }
})();
