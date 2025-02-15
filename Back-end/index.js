import express from "express";
import cors from "cors";
import "./config/dotenv.js";
import "express-async-errors"; // จับ error ใน async function
import morgan from "morgan";
import errorHandler from "./middleware/errorHandler.js"; // นำเข้า Middleware Error

import stockRoutes from "./routes/stock.route.js";
import portfolioRoutes from "./routes/portfolio.route.js";
import authRoutes from "./routes/auth.route.js";

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// ใช้ routes
app.use("/api", stockRoutes);
app.use("/api", portfolioRoutes);
app.use("/api", authRoutes);


app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
