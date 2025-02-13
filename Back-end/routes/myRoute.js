import express, { query } from "express";
import db from "../config/database.js";
import { ObjectId } from "mongodb";
import cron from 'node-cron';
import fetch from "node-fetch";


// import multer from "multer"; 
// import { MongoClient, Binary } from 'mongodb';
// import fs from 'fs';
// import zlib from 'zlib'

const router = express.Router()
const ticker = db.collection('stock_ticker');
const portfolio = db.collection('portfolio')
const transaction = db.collection('transaction')

const keyPool = [
  '609e212acea948feb7450938a016c088',
    '6b589bf0b3464cddbb59539a6c3d8238',
    'bae5aebed6024ffc9bd8118d9f3ef89a',
    'ac2e2c88ebac496d90b92b225aefd4b4',
    'a812690526f24184b0347c0ce8899b8b',
    '96226cc340d647458a8ee8415757f722'
];
let keyIndex = 0;

function getNextApiKey() {
  const key = keyPool[keyIndex];
  keyIndex = (keyIndex + 1) % keyPool.length;
  return key;
}

cron.schedule("*/1 * * * *", async () => {
  console.log("🔄 Checking pending transactions...");

  const now = new Date();
  const pendingTrans = await transaction.find({ status: "pending" }).toArray();

  for (const trans of pendingTrans) {
    const { _id, portId, symbol, bidPrice, action, expiredAt, quantity } = trans;
    const expTime = new Date(expiredAt);

    try {
      if (now >= expTime) {
        await transaction.updateOne({ _id }, { $set: { status: "failed" } });
        console.log(`❌ Transaction ${_id} expired.`);
        continue;
      }

      const apiKey = getNextApiKey();
      const res = await fetch(
        `https://api.twelvedata.com/time_series?apikey=${apiKey}&interval=1min&timezone=Asia/Bangkok&format=JSON&symbol=${symbol}`
      );
      const data = await res.json();
      // console.log(data.values[0].close)
      if (!data.values || data.values.length === 0) continue;
      const marketPrice = parseFloat(data.values[0].close); // ดึงราคาปิดตัวแรกสุด

      if ((action === "buy" && Number(marketPrice).toFixed(2) <= bidPrice) || (action === "sell" && Number(marketPrice).toFixed(2) >= bidPrice)) {
        await transaction.updateOne({ _id }, { $set: { status: "match", actualPrice: Number(marketPrice).toFixed(2) } });

        const apiUrl = action === "buy" ? "http://localhost:5000/stock/buyStock" : "http://localhost:5000/stock/sellStock";
        await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: portId, symbol, quantity, current_mkt_price: Number(marketPrice).toFixed(2) }),
        });

        console.log(`✅ Transaction ${_id} matched at $${Number(marketPrice).toFixed(2)}.`);
      }
    } catch (error) {
      console.error(`⚠️ Error checking transaction ${_id}:`, error);
    }
  }
});

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
    const { portId } = req.params; // ดึงค่า portId จาก URL
    const fields = req.query; // ดึงค่าฟิลด์ที่ต้องการจาก query params

    // ดึงข้อมูลพอร์ตโฟลิโอ
    const portfolioDetails = await portfolio.findOne({ _id: new ObjectId(portId) });

    if (!portfolioDetails) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    // ถ้าผู้ใช้ระบุฟิลด์ที่ต้องการ return เฉพาะฟิลด์นั้น
    if (Object.keys(fields).length > 0) {
      const filteredData = {};
      for (const field in fields) {
        if (portfolioDetails.hasOwnProperty(field)) {
          filteredData[field] = portfolioDetails[field];
        }
      }
      return res.status(200).json(filteredData);
    }

    // ถ้าไม่มี query params ส่งมาทั้ง object
    res.status(200).json(portfolioDetails);
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

router.get("/getAllTransaction", async (req, res) => {
  try {
    const allTransactions = await transaction.find({}).sort({ date: -1 }).toArray(); 
    res.status(200).json(allTransactions);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/createTransaction", async (req, res) => {
  // const { userId, portId, symbol, action, status, totalAmount, bidPrice, actualPrice, quantity } = req.body;

  // // Validate required fields
  // if (!userId || !portId || !symbol || !action || !status || !bidPrice || !totalAmount || !actualPrice || !quantity) {
  //   return res.status(400).json({ message: "Missing required fields." });
  // }

  // try {
  //   const newTransaction = {
  //     userId,
  //     portId,
  //     symbol,
  //     action: action.toLowerCase(), // Ensure action is in lowercase (e.g., "buy" or "sell")
  //     status: status.toLowerCase(), // Ensure status is in lowercase
  //     bidPrice,
  //     totalAmount,
  //     actualPrice,
  //     quantity,
  //     date: new Date().toISOString() // Auto add real-time timestamp (ISO format)
  //   };

  //   const result = await transaction.insertOne(newTransaction);

  //   res.status(201).json({
  //     message: "Transaction created successfully.",
  //     transaction: {
  //       ...newTransaction
  //     }
  //   });
  // } catch (error) {
  //   res.status(500).json({ message: "Error creating transaction.", error: error.message });
  // }
  const { userId, portId, symbol, action, status, totalAmount, bidPrice, actualPrice, quantity } = req.body;

  if (!userId || !portId || !symbol || !action || !status || !bidPrice || !totalAmount || !actualPrice || !quantity) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const now = new Date();
  const expiredAt = new Date(now);
  expiredAt.setUTCHours(21 + 7, 0, 0, 0); // หมดอายุที่ตี 4 ของวันถัดไป (UTC+7)


  try {
    const newTransaction = {
      userId,
      portId,
      symbol,
      action: action.toLowerCase(),
      status: status.toLowerCase(),
      bidPrice,
      totalAmount,
      actualPrice,
      quantity,
      date: new Date().toISOString(),
      expiredAt: expiredAt.toISOString(), // เพิ่มเวลาหมดอายุ
    };

    const result = await transaction.insertOne(newTransaction);

    // ✅ ถ้า status = "match" ให้เรียก buyStock หรือ sellStock ทันที
    if (status.toLowerCase() === "match") {
      if (action.toLowerCase() === "buy") {
        await buyStockHandler(portId, symbol, quantity, actualPrice);
      } else if (action.toLowerCase() === "sell") {
        await sellStockHandler(portId, symbol, quantity, actualPrice);
      }
    }

    res.status(201).json({ message: "Transaction created successfully.", transaction: newTransaction });

  } catch (error) {
    res.status(500).json({ message: "Error creating transaction.", error: error.message });
  }
});

const buyStockHandler = async (_id, symbol, quantity, current_mkt_price) => {
  try {
    await fetch("http://localhost:5000/api/buyStock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id, symbol, quantity, current_mkt_price })
    });
  } catch (error) {
    console.error("Error calling buyStock:", error);
  }
};

const sellStockHandler = async (_id, symbol, quantity, current_mkt_price) => {
  try {
    await fetch("http://localhost:5000/api/sellStock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id, symbol, quantity, current_mkt_price })
    });
  } catch (error) {
    console.error("Error calling sellStock:", error);
  }
};

export default router;
