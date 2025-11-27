import http from "http";
import next from "next";
import { initializeSocketServer } from "./src/lib/socket/socketServer";
import { runStartupChecks } from "./src/lib/template/startupWarnings";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

async function start() {
  // Run early startup checks related to template sandboxing
  runStartupChecks();
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  const server = http.createServer((req, res) => {
    // Diagnostic: log socket-related incoming requests so we can see if handshake reaches the server
    try {
      const url = req.url || "";
      if (url.includes("/socket.io") || url.includes("/api/socket")) {
        console.log(`Incoming socket-related request: ${url} headers:`, {
          origin: req.headers.origin,
          upgrade: req.headers.upgrade,
          connection: req.headers.connection,
        });
      }
    } catch {
      // ignore logging errors
    }

    // Let Next.js handle all requests
    handle(req, res);
  });

  // Log upgrade (websocket) attempts
  server.on("upgrade", (req) => {
    try {
      console.log("HTTP upgrade request:", req.url, { headers: req.headers });
    } catch {
      // ignore
    }
  });

  // Initialize socket.io on the raw HTTP server
  initializeSocketServer(server as unknown as http.Server);

  server.listen(port, () => {
    console.log(`> Server ready on http://${hostname}:${port} (dev=${dev})`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
