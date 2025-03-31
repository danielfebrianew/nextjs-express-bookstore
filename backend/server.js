import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/database.js";
import logger from "./utils/logger.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server: " + error.message);
    process.exit(1);
  }
}

startServer();
