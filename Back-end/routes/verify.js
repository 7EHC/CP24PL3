import express, { query } from "express";
import db from "../config/database.js";
import { ObjectId } from "mongodb";
import cron from "node-cron";
import fetch from "node-fetch";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/authMiddleware.js";
import nodemailer from "nodemailer";
import crypto from "crypto"; 


const API_ROOT = process.env.VITE_ROOT_API;
const secret_key = process.env.JWT_SECRET_KEY

const router = express.Router();
const verificationtoken = db.collection("verificationtoken");
const userSchema = db.collection("user");

// ตั้งค่า Nodemailer
let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "sit.invest.pl3@gmail.com",
        pass: "xgss blmw aakh jpww",
    },
})

// 📌 1) API สำหรับสมัครสมาชิกและส่งอีเมลยืนยัน
router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).send("All input is required.");
    }

    try {
        // 1) ตรวจสอบว่าอีเมลถูกใช้แล้วหรือยัง
        const existingUser = await userSchema.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).send("Email is already registered.");
        }

        // 2) ตรวจสอบว่ามีอีเมลนี้รอการยืนยันอยู่หรือไม่
        const pendingVerification = await verificationtoken.findOne({ email: email.toLowerCase() });
        if (pendingVerification) {
            return res.status(409).send("Email is already pending verification.");
        }

        // 3) เข้ารหัส password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4) สร้าง Token ยืนยันอีเมล
        const token = crypto.randomBytes(32).toString("hex");

        // 5) บันทึกลง Collection `verificationtoken`
        await verificationtoken.insertOne({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password: hashedPassword,
            token,
            createdAt: new Date(), // ใช้ TTL Index เพื่อลบอัตโนมัติหลัง 1 ชั่วโมง
        });

        // // 6) ส่งอีเมลยืนยัน
        // // const verificationLink = `localhost:5000/verify/verify-email?token=${token}`;
        // const mailOptions = {
        //     from: "sit.invest.pl3@gmail.com",
        //     to: email,
        //     subject: "Verify Your Email",
        //     html: `<p>Click the link below to verify your email:</p>
        //            <a href="http:localhost:5137/pl3/verify/${token}">http:localhost:5137/pl3/verify/${token}</a>`,
        // };

        // 6) สร้าง JWT Token สำหรับ Frontend (frontToken)
        const frontToken = jwt.sign(
            { email: email.toLowerCase(), username: username.toLowerCase(),token: token },
            secret_key, // คุณต้องตั้งค่า JWT_SECRET_KEY ใน .env
            { expiresIn: '1h' } // ตั้งเวลาหมดอายุ JWT Token
        )

        // 7) ส่งอีเมลยืนยัน
        const mailOptions = {
            from: "sit.invest.pl3@gmail.com",
            to: email,
            subject: "Verify Your Email",
            html: `<p>Click the link below to verify your email:</p>
                   <a href="http://127.0.0.1:5173/pl3/verify/${frontToken}">http://127.0.0.1:5173/pl3/verify/${frontToken}</a>`,
        }

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
        return res.status(400).send("Invalid verification link.");
    }

    try {
        // 1) ค้นหา Token ใน `verificationtoken`
        const record = await verificationtoken.findOne({ token });

        if (!record) {
            return res.status(400).send("Invalid or expired token.");
        }

        // 2) ย้ายข้อมูลไปยัง `user` collection
        await userSchema.insertOne({
            username: record.username,
            email: record.email,
            password: record.password, // ใช้ password ที่ hash แล้วจากก่อนหน้า
            createdAt: new Date().toISOString(),
        });

        // 3) ลบ Token ที่ใช้ไปแล้ว
        await verificationtoken.deleteOne({ token });

        res.status(200).send("Email verified successfully! You can now log in.");

    } catch (error) {
        console.error("Email Verification Error:", error);
        res.status(500).send("Internal Server Error");
    }
});


export default router;
