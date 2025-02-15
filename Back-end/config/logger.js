import { createLogger, transports, format } from "winston";

// ตั้งค่า Logger
const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "error.log", level: "error" }) // Log error ลงไฟล์
  ]
});

export default logger;
