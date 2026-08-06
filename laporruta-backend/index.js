require("dotenv").config();
const http = require("node:http");
const app = require("./src/app");
const db = require("./src/config/database");
const redisClient = require("./src/config/redis");
const socketConfig = require("./src/config/socket");

const PORT = process.env.PORT || 8080;
const server = http.createServer(app);

async function startServer() {
  try {
    await db.query("SELECT NOW()");
    console.log("PostgreSQL connected successfully");

    await redisClient.connect();
    console.log("Redis connected successfully");

    socketConfig.init(server);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

const shutdown = async (signal) => {
  console.log(`${signal} received, shutting down gracefully`);
  
  server.close(async (err) => {
    if (err) console.error("HTTP server close error:", err);
    
    try {
      await db.close(); 
      await redisClient.disconnect();
      process.exit(0);
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError);
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer();