import rateLimit from "express-rate-limit";

// 📌 จำกัดไม่เกิน 5 request ต่อนาที ต่อ IP สำหรับ register route
const registerRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 นาที
    max: 5, // จำกัดสูงสุด 5 ครั้ง
    message: {
      status: 429,
      error: "Too many registration attempts. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  export default registerRateLimiter