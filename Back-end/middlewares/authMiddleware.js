import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // ดึง token จาก Header

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.TOKEN_KEY); // Decode Token
    req.userId = decoded.user_id; // ใส่ userId ลงใน req

    next(); // ไปยัง endpoint ถัดไป
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

export default authMiddleware;
