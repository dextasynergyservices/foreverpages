// Use global fetch available in Node 18+ (tsx will provide fetch)
const fetch = globalThis.fetch as typeof globalThis.fetch;
import { io } from "socket.io-client";

const HTTP_URL = process.env.SOCKET_URL || "http://localhost:3000";

async function checkHttp() {
  console.log(`Checking HTTP root: ${HTTP_URL}/`);
  const res = await fetch(`${HTTP_URL}/`);
  console.log(`HTTP ${res.status} ${res.statusText}`);
}

async function checkHealth() {
  console.log(`Checking health: ${HTTP_URL}/api/health`);
  const res = await fetch(`${HTTP_URL}/api/health`);
  const json = await res.json();
  console.log("Health:", json);
}

async function checkSocket() {
  console.log(`Checking socket: ${HTTP_URL}/api/socket`);
  return new Promise<void>((resolve, reject) => {
    let socket = io(HTTP_URL, { path: "/api/socket", transports: ["websocket"] });

    socket.on("connect", () => {
      console.log("Socket connected", socket.id);
      socket.disconnect();
      resolve();
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect error", err);
      // Try polling fallback once
      console.log("Websocket failed, trying polling fallback...");
      socket = io(HTTP_URL, { path: "/api/socket", transports: ["polling"] });
      socket.on("connect", () => {
        console.log("Socket connected via polling", socket.id);
        socket.disconnect();
        resolve();
      });

      socket.on("connect_error", (err2) => {
        console.error("Polling connect error", err2);
        reject(err2);
      });
    });

    setTimeout(() => {
      reject(new Error("Socket connect timeout"));
    }, 5000);
  });
}

(async function main() {
  try {
    await checkHttp();
    await checkHealth();
    await checkSocket();
    console.log("All checks passed");
    process.exit(0);
  } catch (err) {
    console.error("Checks failed:", err);
    process.exit(1);
  }
})();
