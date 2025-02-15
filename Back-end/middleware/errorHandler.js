import logger from "../config/logger.js"; // Logger สำหรับเก็บ Log

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const details = process.env.NODE_ENV === "production" ? null : err.stack;

  // Log error
  logger.error({
    message: err.message,
    statusCode,
    details,
  });

  res.status(statusCode).json({
    success: false,
    message,
    details,
  });
};

export default errorHandler;
