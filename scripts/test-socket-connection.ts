import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

console.log(`Attempting to connect to socket at ${SOCKET_URL}/api/socket`);

const socket = io(SOCKET_URL, { path: "/api/socket", transports: ["websocket"] });

socket.on("connect", () => {
  console.log("Connected to socket.io server, id=", socket.id);
  socket.emit("ping-test", { message: "hello from test client" });
});

socket.on("connect_error", (err) => {
  console.error("Connect error:", err);
  process.exit(1);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});

socket.on("error", (data) => {
  console.error("Server error:", data);
});

setTimeout(() => {
  console.log("Test finished, disconnecting");
  socket.disconnect();
  process.exit(0);
}, 5000);
