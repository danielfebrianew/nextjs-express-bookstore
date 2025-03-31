import winston from "winston";
import path from "path";

const logDir = path.resolve("logs");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.printf(({ level, message }) => {
      return `[${new Date().toLocaleString()} WIB] ${level}: ${message}`;
    }),
  transports: [
    new winston.transports.Console(),

    new winston.transports.File({
        filename: path.join(logDir, "application.log"),
        maxsize: 1 * 1024 * 1024,
        maxFiles: 14,
        tailable: true
    }),

    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 1 * 1024 * 1024,
      maxFiles: 14,
      tailable: true
    }),
  ],
  exitOnError: false
});

export default logger;
