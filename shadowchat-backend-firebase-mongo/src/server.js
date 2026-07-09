const http = require("http");
const createApp = require("./app");
const env = require("./config/env");
const { connectDb } = require("./config/db");
const { initSocketServer } = require("./sockets");

async function startServer() {
  await connectDb();

  const app = createApp();
  const httpServer = http.createServer(app);
  const io = initSocketServer(httpServer);
  app.set("io", io);

  httpServer.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
    console.log(`Base URL: ${env.appBaseUrl}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});


