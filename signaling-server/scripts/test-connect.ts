import { signToken } from "../src/jwt";
import { io as Client } from "socket.io-client";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const SERVER_URL = process.env.TEST_SERVER_URL || "http://localhost:3000";
const JWT_SECRET = process.env.JWT_SECRET || "test-secret";

async function main() {
  const token = signToken({ userId: "test-user" }, JWT_SECRET, { expiresIn: "10m" });

  console.log("Connecting to", SERVER_URL, "with token", token.slice(0, 24) + "...");

  const socket = Client(`${SERVER_URL}`, {
    path: "/api/socket",
    auth: { token },
    reconnectionAttempts: 2,
    timeout: 5000,
  });

  socket.on("connect", () => {
    console.log("connected", socket.id);
    socket.disconnect();
    process.exit(0);
  });

  socket.on("connect_error", (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("connect_error", msg);
    process.exit(2);
  });

  socket.on("error", (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("socket error", msg);
  });

  // Safety timeout
  setTimeout(() => {
    console.error("Connection timed out");
    socket.disconnect();
    process.exit(3);
  }, 15000);
}

main().catch((err) => {
  console.error(err);
  process.exit(4);
});
