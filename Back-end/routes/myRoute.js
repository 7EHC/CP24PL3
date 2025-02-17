import express, { query } from "express";
import db from "../config/database.js";
import { ObjectId } from "mongodb";
import cron from "node-cron";
import fetch from "node-fetch";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
const ticker = db.collection("stock_ticker");
const portfolio = db.collection("portfolio");
const transaction = db.collection("transaction");
const userSchema = db.collection("user");

const keyPool = [
  "609e212acea948feb7450938a016c088",
  "6b589bf0b3464cddbb59539a6c3d8238",
  "bae5aebed6024ffc9bd8118d9f3ef89a",
  "ac2e2c88ebac496d90b92b225aefd4b4",
  "a812690526f24184b0347c0ce8899b8b",
  "96226cc340d647458a8ee8415757f722",
];
let keyIndex = 0;

function getNextApiKey() {
  const key = keyPool[keyIndex];
  keyIndex = (keyIndex + 1) % keyPool.length;
  return key;
}

cron.schedule("*/1 * * * *", async () => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday

  // ❌ หยุดทำงานถ้าเป็นวันเสาร์หรืออาทิตย์
  if (day === 0 || day === 6) return;

  // ❌ ทำงานเฉพาะช่วง 20:00 - 03:59 (เพราะ 04:00 ไม่รวม)
  if (hour < 20 && hour >= 4) return;

  console.log(`🔄 Checking pending transactions... at ${now}`);

  const pendingTrans = await transaction.find({ status: "pending" }).toArray();

  for (const trans of pendingTrans) {
    const { _id, portId, symbol, bidPrice, action, expiredAt, quantity } =
      trans;
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

      if (!data.values || data.values.length === 0) continue;
      const marketPrice = parseFloat(data.values[0].close);

      if (
        (action === "buy" && marketPrice.toFixed(2) <= bidPrice) ||
        (action === "sell" && marketPrice.toFixed(2) >= bidPrice)
      ) {
        await transaction.updateOne(
          { _id },
          { $set: { status: "match", actualPrice: marketPrice.toFixed(2) } }
        );

        const apiUrl =
          action === "buy"
            ? "http://localhost:5000/api/buyStock"
            : "http://localhost:5000/api/sellStock";
        await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            _id: portId,
            symbol,
            quantity,
            current_mkt_price: marketPrice.toFixed(2),
          }),
        });

        console.log(
          `✅ Transaction ${_id} matched at $${marketPrice.toFixed(2)}.`
        );
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
});

router.get("/searchTickers/:identifier", async (req, res) => {
  try {
    const identifier = req.params.identifier;
    const formForShow = {
      projection: { _id: 0, ticker: 1, name: 1, market: 1, type: 1 },
    };
    const solution = {
      $or: [
        { ticker: { $regex: `^${identifier}`, $options: "i" } },
        { name: { $regex: `^${identifier}`, $options: "i" } },
      ],
    };
    const ResultTic = await ticker.find(solution, formForShow).toArray();

    res.status(200).json(ResultTic); // ส่งผลลัพธ์กลับ
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" }); // จัดการข้อผิดพลาด
  }
});

router.post("/portfolios/create", async (req, res) => {
  const { userId, portfolio_name, assets } = req.body;

  if (!portfolio_name || !assets) {
    return res
      .status(400)
      .json({
        message:
          "กรุณากรอกชื่อพอร์ตและข้อมูลหุ้นที่ต้องการสร้าง (portfolio_name และ assets)",
      });
  }

  try {
    const newPortfolio = {
      userId,
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
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการสร้างพอร์ต", error: error.message });
  }
});

router.get("/portfolios", authMiddleware, async (req, res) => {
  try {
    const portfolios = await portfolio.find({ userId: req.userId }).toArray(); // Fetch all portfolios from MongoDB
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
    const portfolioDetails = await portfolio.findOne({
      _id: new ObjectId(portId),
    });

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
        updatedAsset: Findportfolio.assets.find(
          (asset) => asset.name === symbol
        ),
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
    await portfolio.updateOne(
      { _id: new ObjectId(_id), "assets.name": symbol },
      { $inc: { "assets.$.quantity": -quantity } }
    );

    // Re-fetch portfolio to check the updated quantity
    const updatedPortfolio = await portfolio.findOne(
      { _id: new ObjectId(_id) },
      { assets: 1 }
    );

    // Find the updated asset again
    const updatedAsset = updatedPortfolio.assets.find(
      (asset) => asset.name === symbol
    );

    // If the asset quantity is 0, remove it from the portfolio
    if (updatedAsset && updatedAsset.quantity === 0) {
      await portfolio.updateOne(
        { _id: new ObjectId(_id) },
        { $pull: { assets: { name: symbol } } }
      );
    }

    return res.status(200).json({
      message: "ขายหุ้นสำเร็จ",
    });
  } catch (error) {
    console.error("Error occurred while selling stock:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
});

router.get("/getAllTransaction", authMiddleware, async (req, res) => {
  try {
    const allTransactions = await transaction
      .find({ userId: req.userId })
      .sort({ date: -1 })
      .toArray();
    res.status(200).json(allTransactions);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/createTransaction", async (req, res) => {
  const requiredFields = [
    "userId",
    "portId",
    "symbol",
    "action",
    "status",
    "totalAmount",
    "bidPrice",
    "actualPrice",
    "quantity",
  ];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: "Missing required fields.",
      missingFields, // ✅ บอกว่า field ไหนขาด
    });
  }

  const now = new Date();
  const expiredAt = new Date(now);
  expiredAt.setUTCHours(21 + 7, 0, 0, 0); // หมดอายุที่ตี 4 ของวันถัดไป (UTC+7)

  try {
    const newTransaction = {
      userId: req.body.userId,
      portId: req.body.portId,
      symbol: req.body.symbol,
      action: req.body.action.toLowerCase(),
      status: req.body.status.toLowerCase(),
      bidPrice: req.body.bidPrice,
      totalAmount: req.body.totalAmount,
      actualPrice: req.body.actualPrice,
      quantity: req.body.quantity,
      date: new Date().toISOString(),
      expiredAt: expiredAt.toISOString(), // ✅ เพิ่มเวลาหมดอายุ
    };

    const result = await transaction.insertOne(newTransaction);

    // ✅ ถ้า status = "match" ให้เรียก buyStock หรือ sellStock ทันที
    if (newTransaction.status === "match") {
      if (newTransaction.action === "buy") {
        await buyStockHandler(
          newTransaction.portId,
          newTransaction.symbol,
          newTransaction.quantity,
          newTransaction.actualPrice
        );
      } else if (newTransaction.action === "sell") {
        await sellStockHandler(
          newTransaction.portId,
          newTransaction.symbol,
          newTransaction.quantity,
          newTransaction.actualPrice
        );
      }
    }

    res.status(201).json({
      message: "Transaction created successfully.",
      transaction: newTransaction,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating transaction.", error: error.message });
  }
});

const buyStockHandler = async (_id, symbol, quantity, current_mkt_price) => {
  try {
    await fetch("http://localhost:5000/api/buyStock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id, symbol, quantity, current_mkt_price }),
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
      body: JSON.stringify({ _id, symbol, quantity, current_mkt_price }),
    });
  } catch (error) {
    console.error("Error calling sellStock:", error);
  }
};
//Register
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  // 1) ตรวจสอบ Input
  if (!username || !password) {
    return res.status(400).send("All input is required");
  }

  try {
    // 2) เช็คว่ามี user ซ้ำไหม
    const oldUser = await userSchema.findOne({ username });
    if (oldUser) {
      return res.status(409).send("User already exists, please login.");
    }

    // 3) เข้ารหัส password
    const encryptedPassword = await bcrypt.hash(password, 10);

    // 4) สร้าง user
    const newUser = {
      username,
      password: encryptedPassword,
      createdAt: new Date().toISOString(),
    };

    const result = await userSchema.insertOne(newUser);

    // 5) สร้าง Token
    const token = jwt.sign(
      { user_id: result.insertedId, username },
      process.env.TOKEN_KEY, // ตรวจสอบว่ามีค่าใน .env
      { expiresIn: "1d" }
    );

    // 6) ใส่ token ลงใน user object
    newUser.token = token;

    // 7) ส่งกลับโดยตัด password ออก
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

//Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // ตรวจสอบว่ามี username และ password มาหรือไม่
  if (!username || !password) {
    return res.status(400).send("All input is required");
  }

  try {
    // ค้นหา user จากฐานข้อมูล
    const user = await userSchema.findOne({ username });
    if (!user) {
      return res.status(400).send("Invalid Credentials");
    }

    // ตรวจสอบความถูกต้องของรหัสผ่าน
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).send("Invalid Credentials");
    }

    // สร้าง JWT token
    const token = jwt.sign(
      { user_id: user._id, username },
      process.env.TOKEN_KEY,
      { expiresIn: "1d" }
    );

    // ใส่ token ลงใน user object
    user.token = token;

    // ส่งกลับข้อมูล user โดยไม่แสดงรหัสผ่าน
    const { password: pwd, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
