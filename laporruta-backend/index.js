require("dotenv").config();
const app = require("./src/app");
const db = require("./src/config/database");
const redisClient = require("./src/config/redis");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    await db.query("SELECT NOW()");
    console.log("PostgreSQL connected successfully");

    // Connect Redis
    await redisClient.connect();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await db.close();
  await redisClient.disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  await db.close();
  await redisClient.disconnect();
  process.exit(0);
});

startServer();
