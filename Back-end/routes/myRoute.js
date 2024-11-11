import express, { query } from "express";
import db from "../config/database.js";
// import multer from "multer"; 
// import { MongoClient, Binary } from 'mongodb';
// import fs from 'fs';
// import zlib from 'zlib'

const router = express.Router()
const ticker = db.collection('stock_ticker');
const portfolio = db.collection('portfolio')

  router.get("/allticker", async (req,res)=>{
    try {
      const allTicker = await ticker.find({}).toArray(); // ดึงข้อมูล ticker ทั้งหมดจาก MongoDB
      res.status(200).json(allTicker); // ส่งข้อมูล ticker กลับในรูปแบบ JSON
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  })

  router.get("/searchFromTic/:identifier", async (req, res) => {
    try {
  
      const identifier = req.params.identifier;
      const formForShow = { projection: { _id: 0, ticker: 1, name: 1, market: 1, type: 1 } }
      const solution = {
        $or: [
          { ticker: { $regex: `^${identifier}`, $options: 'i' } },
          { name: { $regex: `^${identifier}`, $options: 'i' } }
        ]
      }; 
      const ResultTic = await ticker.find(
        solution, formForShow
      ).toArray();
  
      res.status(200).json(ResultTic); // ส่งผลลัพธ์กลับ
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" }); // จัดการข้อผิดพลาด
    }
  })

  router.post("/createPort", async (req, res) => {
    const { portfolio_name, assets } = req.body;
  
    if (!portfolio_name || !assets) {
      return res.status(400).json({ message: "กรุณากรอกชื่อพอร์ตและข้อมูลหุ้นที่ต้องการสร้าง (portfolio_name และ assets)" });
    }
  
    try {
      const newPortfolio = {
        portfolio_name,
        assets,
        createdAt: new Date(), 
      };
  
      const result = await portfolio.insertOne(newPortfolio);
  
      res.status(201).json({
        message: "พอร์ตถูกสร้างสำเร็จ",
        portfolio: {
          _id: result.insertedId,
          portfolio_name,
          assets,
        }
      });
    } catch (error) {
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างพอร์ต", error: error.message });
    }
  });

  router.get("/getPort", async (req, res) => {
    try {
      const portfolios = await portfolio.find().toArray(); // Fetch all portfolios from MongoDB
      res.status(200).json(portfolios); // Send portfolio data as JSON
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

export default router;