import express, { query } from "express";
import db from "../config/database.js";
import { ObjectId } from "mongodb";
// import multer from "multer"; 
// import { MongoClient, Binary } from 'mongodb';
// import fs from 'fs';
// import zlib from 'zlib'

const router = express.Router()
const ticker = db.collection('stock_ticker');
const portfolio = db.collection('portfolio')

router.get("/allticker", async (req, res) => {
  try {
    const allTicker = await ticker.find({}).toArray(); // ดึงข้อมูล ticker ทั้งหมดจาก MongoDB
    res.status(200).json(allTicker); // ส่งข้อมูล ticker กลับในรูปแบบ JSON
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
})

router.get("/searchTickers/:identifier", async (req, res) => {
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

router.post("/portfolios/create", async (req, res) => {
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

router.get("/portfolios", async (req, res) => {
  try {
    const portfolios = await portfolio.find().toArray(); // Fetch all portfolios from MongoDB
    res.status(200).json(portfolios); // Send portfolio data as JSON
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/portfolios/portDetails/:portId", async (req, res) => {
  try {
    const { portId } = req.params; // Extract the parameter from the URL

    // Fetch the specific portfolio based on the provided parameter
    const portfolioDetails = await portfolio.findOne({ _id: new ObjectId(portId) });

    if (!portfolioDetails) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    res.status(200).json(portfolioDetails); // Send the portfolio details as JSON
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/buyStock", async (req, res) => {
  const { _id, symbol, quantity, current_mkt_price } = req.body;

if (!_id || !symbol || !quantity || !current_mkt_price) {
  return res.status(400).json({
    message: "กรุณากรอกข้อมูลพอร์ต, ชื่อหุ้น, จำนวนหุ้น และราคา",
  });
}

try {
  
  const Findportfolio = await portfolio.findOne({ _id: new ObjectId(_id) });

  if (!Findportfolio) {
    return res.status(404).json({ message: "ไม่พบพอร์ตที่ระบุ" });
  }

  const assetExists = Findportfolio.assets.some(
    (asset) => asset.name === symbol
  );

  if (assetExists) {
    const updatedPortfolio = await portfolio.updateOne(
      { _id: new ObjectId(_id) },
      { $inc: { "assets.$[elem].quantity": quantity } },
      { arrayFilters: [{ "elem.name": symbol }] }
    );

    return res.status(200).json({
      message: "ซื้อหุ้นสำเร็จ",
      updatedPortfolio: updatedPortfolio,
      updatedAsset: Findportfolio.assets.find((asset) => asset.name === symbol),
    });
  } else {
    const newAsset = {
      name: symbol,
      quantity: quantity,
      current_mkt_price: current_mkt_price,
      purchased_at: new Date(),
    };

    const updatedPortfolio = await portfolio.updateOne(
      { _id: new ObjectId(_id) },
      { $push: { assets: newAsset } }
    );

    return res.status(200).json({
      message: "เพิ่มหุ้นสำเร็จ",
      updatedPortfolio: updatedPortfolio,
      newAsset: newAsset,
    });
  }
} catch (error) {
  console.error("Error occurred while buying stock:", error);
  res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
}

});

router.post("/sellStock", async (req, res) => {
  // const { portfolio_name, symbol, quantity, current_mkt_price } = req.body;
  // if (!portfolio_name || !symbol || !quantity || !current_mkt_price) {
  //   return res.status(400).json({ message: "กรุณากรอกข้อมูลพอร์ต, ชื่อหุ้น, จำนวนหุ้น และราคา" });
  // }
  // try {
  //   const Findportfolio = await portfolio.findOne({ portfolio_name });
  //   if (!Findportfolio) {
  //     return res.status(404).json({ message: "ไม่พบพอร์ตที่ระบุ" });
  //   }
    
  //   const assetExists = Findportfolio.assets.some(asset => asset.name = symbol)
  //   if (assetExists) {
  //     const updatedPortfolio = await portfolio.updateOne(
  //       { portfolio_name },
  //       { 
  //         $inc: { "assets.$[elem].quantity": -quantity }  
  //       },
  //       { arrayFilters: [{ "elem.name": symbol }] }  
  //     );
    

  //     const assetAfterSale = await portfolio.findOne(
  //       { portfolio_name, "assets.name": symbol },
  //       { "assets.$": 1 }  
  //     );
    
  //     if (assetAfterSale && assetAfterSale.assets[0].quantity <= 0) {
  //       await portfolio.updateOne(
  //         { portfolio_name },
  //         { $pull: { assets: { name: symbol } } } 
  //       );
  //       return res.status(200).json({
  //         message: "ขายหุ้นสำเร็จ",
  //       });
  //     }
  //     return res.status(200).json({
  //       message: "ขายหุ้นสำเร็จ",
  //       updatedPortfolio: updatedPortfolio,
  //     });
  //   } else {
  //     return res.status(404).json({ message: "ไม่พบหุ้นในพอร์ตที่ระบุ" });
  //   }

  // } catch(error){
  //   console.error("Error occurred while buying stock:", error);
  //   res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  // }
  const { _id, symbol, quantity, current_mkt_price } = req.body;

// Validate input parameters
if (!_id || !symbol || !quantity || !current_mkt_price) {
  return res.status(400).json({
    message: "กรุณากรอกข้อมูลพอร์ต, ชื่อหุ้น, จำนวนหุ้น และราคา",
  });
}

try {
  // Find the portfolio by _id
  const Findportfolio = await portfolio.findOne({ _id: new ObjectId(_id) });

  if (!Findportfolio) {
    return res.status(404).json({ message: "ไม่พบพอร์ตที่ระบุ" });
  }

  // Check if the stock exists in the portfolio's assets
  const asset = Findportfolio.assets.find((asset) => asset.name === symbol);
  if (!asset) {
    return res.status(404).json({ message: "ไม่พบหุ้นในพอร์ตที่ระบุ" });
  }

  // Check if the quantity to sell is valid
  if (quantity > asset.quantity) {
    return res.status(400).json({
      message: `จำนวนหุ้นที่ต้องการขาย (${quantity}) มากกว่าจำนวนหุ้นในพอร์ต (${asset.quantity})`,
    });
  }

  // Perform the sale by decrementing the quantity
  const updatedPortfolio = await portfolio.updateOne(
    { _id: new ObjectId(_id), "assets.name": symbol },
    { $inc: { "assets.$.quantity": -quantity } }
  );

  // Check if the asset quantity is zero or less after the sale
  const assetAfterSale = await portfolio.findOne(
    { _id: new ObjectId(_id), "assets.name": symbol },
    { "assets.$": 1 }
  );

  if (assetAfterSale.assets[0].quantity <= 0) {
    await portfolio.updateOne(
      { _id: new ObjectId(_id) },
      { $pull: { assets: { name: symbol } } }
    );
  }

  return res.status(200).json({
    message: "ขายหุ้นสำเร็จ",
    updatedPortfolio,
  });
} catch (error) {
  console.error("Error occurred while selling stock:", error);
  res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
}
});

export default router;
