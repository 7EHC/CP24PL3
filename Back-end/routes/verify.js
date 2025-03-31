import express, { query } from "express";
import db from "../config/database.js";
import { ObjectId } from "mongodb";
import { Decimal128 } from 'mongodb';
import cron from "node-cron";
import fetch from "node-fetch";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/authMiddleware.js";
import nodemailer from "nodemailer";
import crypto from "crypto";
import registerRateLimiter from "../middlewares/rateLimit.js";

const VERIFY_API_ROOT = process.env.VITE_ROOT_FRONT_API;
const secret_key = process.env.JWT_SECRET_KEY;

const router = express.Router();
const verificationtoken = db.collection("verificationtoken");
const userSchema = db.collection("user");

// ตั้งค่า Nodemailer
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 📌 1) API สำหรับสมัครสมาชิกและส่งอีเมลยืนยัน
router.post("/register",registerRateLimiter, async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send("All input is required.");
  }

  try {
    let errors = {};

    // ✅ 1) Validate Format ก่อน
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,15}$/;

    if (!emailRegex.test(email)) {
      errors.email = "Invalid email format.";
    }

    if (!passwordRegex.test(password)) {
      errors.password = "Password must be 8-15 characters, include an uppercase letter, a number, and a special character.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json(errors); // ⛔ 400: Format ผิด
    }

    // ✅ 2) ตรวจซ้ำใน DB (Check Conflict)
    const existingUser = await userSchema.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      errors.username = "Username is already registered.";
    }

    const existingEmail = await userSchema.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      errors.email = "Email is already registered.";
    }

    const pendingVerification = await verificationtoken.findOne({ email: email.toLowerCase() });
    if (pendingVerification) {
      errors.pendingEmail = "Email is already pending verification.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(409).json(errors); // ⛔ 409: Conflict (ซ้ำ)
    }

    // ✅ 3) เข้ารหัส password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ 4) สร้าง token สำหรับยืนยัน
    const token = crypto.randomBytes(32).toString("hex");

    await verificationtoken.insertOne({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      token,
      createdAt: new Date(), // TTL index จะลบอัตโนมัติหลัง 1 ชั่วโมง
    });

    // ✅ 5) สร้าง JWT Token สำหรับ frontend
    const frontToken = jwt.sign(
      {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        token: token,
      },
      secret_key,
      { expiresIn: "1h" }
    );

    // ✅ 6) ส่งอีเมลยืนยัน
    const mailOptions = {
      from: "sit.invest.pl3@gmail.com",
      to: email,
      subject: "Verify Your Email",
      html: `<div style = "text-align: center; background-color: #f3f4f6; padding: 20px;">
            <h1>Welcome to SIT Invest</h1>
            <h2>Thank you for choosing SIT Invest. To get started, please verify your email address.</h2>
            <p>Click the button below to verify your email:</p>
            <a href="${VERIFY_API_ROOT}/verify/${frontToken}" 
                style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #22c55e; text-decoration: none; border-radius: 5px; cursor: pointer; border: none;">
                Verify Email</a>
            </div>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).send("Failed to send verification email.");
      }
      res.status(200).send("Verification email sent. Please check your inbox.");
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// 📌 2) API สำหรับยืนยันอีเมล
router.get("/verify-email", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Invalid verification link." });
  }

  try {
    // 1) ค้นหา Token ใน `verificationtoken`
    const record = await verificationtoken.findOne({ token });

    if (!record) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    // 2) ย้ายข้อมูลไปยัง `user` collection
    await userSchema.insertOne({
      username: record.username,
      email: record.email,
      password: record.password, // ใช้ password ที่ hash แล้วจากก่อนหน้า
      balance: Decimal128.fromString('100000.00'),
      createdAt: new Date().toISOString(),
    });

    // 3) ลบ Token ที่ใช้ไปแล้ว
    await verificationtoken.deleteOne({ token });

    res.status(200).json({ message: "Email verified successfully! You can now log in." });
  } catch (error) {
    console.error("Email Verification Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
