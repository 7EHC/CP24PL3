import express, { query } from "express";
import db from "../config/database.js";
import { ObjectId } from "mongodb";
import cron from "node-cron";
import fetch from "node-fetch";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/authMiddleware.js";
import nodemailer from "nodemailer";

const API_ROOT = process.env.VITE_ROOT_API;

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
  // const hour = now.getHours();
  // const day = now.getDay(); // 0 = Sunday, 6 = Saturday

  // // ❌ หยุดทำงานถ้าเป็นวันเสาร์หรืออาทิตย์
  // if (day === 0 || day === 6) return;

  // // ❌ ทำงานเฉพาะช่วง 20:00 - 03:59 (เพราะ 04:00 ไม่รวม)
  // if (hour < 20 && hour >= 4) return;
  const res = await fetch(
    `https://api.polygon.io/v1/marketstatus/now?apiKey=30mHX3fZfxe_ievjRkBlJJCjv6DvmpdU`
  );
  if (!res.ok) throw new Error(`HTTP Error! Status: ${res.status}`);

  const status = await res.json();
  console.log(`📢 Market Status: ${status.market}`);
  if (status.market.toString() === "closed") {
    console.log("⏸ Market is closed, skipping transaction check.");
    return;
  }

  console.log(`🔄 Checking pending transactions... at ${now}`);

  const pendingTrans = await transaction.find({ status: "pending" }).toArray();

  for (const trans of pendingTrans) {
    const { _id, portId, symbol, bidPrice, action, expiredAt, quantity } =
      trans;
    const expTime = new Date(expiredAt);

    try {
      // Ensure that userId is properly converted to ObjectId if it's a string
      const userId = await transaction.findOne(
        { _id: new ObjectId(_id) },
        { _id: 0, userId: 1 }
      );
      // console.log(userId)
      const user = await userSchema.findOne(
        { _id: new ObjectId(userId.userId) },
        { _id: 0, email: 1 }
      );
      const userEmail = user ? user.email : "Unknown";
      // console.log(userEmail)

      if (now >= expTime) {
        await transaction.updateOne({ _id }, { $set: { status: "failed" } });
        console.log(`❌ Transaction ${_id} expired.`);
        console.log(`📧 User email: ${userEmail}`); // Log the email after expiration
        const detail = await transaction.findOne(
          { _id: new ObjectId(_id) },
          { _id: 0, userId: 1 }
        );
        // Send email notification
        const mailOptions = {
          from: "sit.invest.pl3@gmail.com", // Sender's email address
          to: userEmail, // User's email address
          subject: "Transaction result", // Email subject
          text: `${detail.action.toUpperCase()}: ${detail.symbol} amount ${
            detail.totalAmount
          } is ${detail.status}`, // Email body
        };

        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Error sending email:", error);
          } else {
            console.log("Email sent: " + info.response);
          }
        });
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

        await userSchema.updateOne(
          { _id: userId },
          {
            $inc: {
              balance:
                action === "buy" ? -bidPrice * quantity : bidPrice * quantity,
            },
          }
        );

        const apiUrl =
          action === "buy" ? `${API_ROOT}/buyStock` : `${API_ROOT}/sellStock`;
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
          `✅ Transaction ${_id} matched at $${marketPrice.toFixed(2)}`
        );
        console.log(`📧 User email: ${userEmail}`); // Log the email after matching
        const detail = await transaction.findOne(
          { _id: new ObjectId(_id) },
          { _id: 0, userId: 1 }
        );

        const mailOptions = {
          from: "sit.invest.pl3@gmail.com", // Sender's email address
          to: userEmail, // User's email address
          subject: "Transaction result", // Email subject
          text: `${detail.action.toUpperCase()}: ${detail.symbol} amount ${
            detail.totalAmount
          } is ${detail.status}`, // Email body
        };

        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Error sending email:", error);
          } else {
            console.log("Email sent: " + info.response);
          }
        });
      }
    } catch (error) {
      console.error(`⚠️ Error checking transaction ${_id}:`, error);
    }
  }
});

router.get("/userDetails/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    const userDetail = await userSchema.findOne({ _id: new ObjectId(userId) });
    res.status(200).json(userDetail);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
    return res.status(400).json({
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

router.delete(
  "/portfolios/delete/:portId",
  authMiddleware,
  async (req, res) => {
    try {
      const portId = req.params.portId;
      const findPort = await portfolio.findOne({ _id: new ObjectId(portId) });
      // console.log(findPort.assets);
      if (findPort.assets.length === 0) {
        await portfolio.deleteOne({ _id: new ObjectId(portId) });
        res.status(200).json({
          success: true,
          message: findPort.portfolio_name + " deleted successfully!",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Cannot delete portfolio with assets in it.",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.patch("/portfolios/update/:portId", async (req, res) => {
  try {
    const portId = req.params.portId;
    const newPortName = req.body.portfolio_name;
    // console.log(newPortName);

    const existingPort = await portfolio.findOne({
      _id: new ObjectId(portId),
    });

    if (!existingPort) {
      return res
        .status(404)
        .json({ success: false, message: "Portfolio not found" });
    }
    const allPort = await portfolio
      .find({ userId: existingPort.userId })
      .toArray();
    const isDuplicate = allPort.some(
      (port) => port.portfolio_name.toLowerCase() === newPortName.toLowerCase()
    );
    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: "Error: Portfolio name " + newPortName + " already exists.",
      });
    } else {
      await portfolio.updateOne(
        { _id: new ObjectId(portId) },
        { $set: { portfolio_name: newPortName } }
      );
      return res.status(200).json({
        success: true,
        message: "Portfolio name updated successfully!",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
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

      await userSchema.updateOne(
        { _id: new ObjectId(Findportfolio.userId) },
        {
          $inc: {
            balance: -current_mkt_price * quantity,
          },
        }
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

      await userSchema.updateOne(
        { _id: new ObjectId(Findportfolio.userId) },
        {
          $inc: {
            balance: -current_mkt_price * quantity,
          },
        }
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

    await userSchema.updateOne(
      { _id: new ObjectId(Findportfolio.userId) },
      {
        $inc: {
          balance: current_mkt_price * quantity,
        },
      }
    );

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
    const filter = { userId: req.userId };
    // ถ้ามีพารามิเตอร์ action ให้เพิ่มลงใน filter
    if (req.query.action) {
      filter.action = req.query.action;
    }
    // ถ้ามีพารามิเตอร์ status ให้เพิ่มลงใน filter
    if (req.query.status) {
      filter.status = req.query.status;
    }
    // Port ID
    if (req.query.portId) {
      filter.portId = req.query.portId;
    }

    if (req.query.symbol) {
      filter.symbol = req.query.symbol;
    }

    if (req.query.fromDate || req.query.toDate) {
      const isoFormatRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      filter.date = {};

      if (req.query.fromDate) {
        if (isoFormatRegex.test(req.query.fromDate)) {
          filter.date.$gte = req.query.fromDate;
        } else {
          return res.status(400).json({
            error:
              "Invalid fromDate format. Use ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)",
          });
        }
      }

      if (req.query.toDate) {
        if (isoFormatRegex.test(req.query.toDate)) {
          filter.date.$lte = req.query.toDate;
        } else {
          return res.status(400).json({
            error:
              "Invalid toDate format. Use ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)",
          });
        }
      }
    }

    const allTransactions = await transaction
      .find(filter)
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

router.put("/updateTransaction/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params; // รับ transactionId จาก URL
    const { status } = req.query; // รับ status ใหม่จาก query parameter

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    const filter = { _id: new ObjectId(id) };
    const update = { $set: { status } };

    const result = await transaction.updateOne(filter, update);

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ error: "Transaction not found or not authorized" });
    }

    res
      .status(200)
      .json({ message: "Transaction status updated successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const buyStockHandler = async (_id, symbol, quantity, current_mkt_price) => {
  try {
    await fetch(`${API_ROOT}/buyStock`, {
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
    await fetch(`${API_ROOT}/sellStock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id, symbol, quantity, current_mkt_price }),
    });
  } catch (error) {
    console.error("Error calling sellStock:", error);
  }
};

// Setup NodeMailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // You can use other services or SMTP
  auth: {
    user: "sit.invest.pl3@gmail.com", // Your email here
    pass: "xgss blmw aakh jpww", // Your email password or app password
  },
});
//Register
router.post("/register", async (req, res) => {
  // const { username, password } = req.body;

  // // 1) ตรวจสอบ Input
  // if (!username || !password) {
  //   return res.status(400).send("All input is required");
  // }

  // try {
  //   // 2) เช็คว่ามี user ซ้ำไหม
  //   const oldUser = await userSchema.findOne({ username });
  //   if (oldUser) {
  //     return res.status(409).send("User already exists, please login.");
  //   }

  //   // 3) เข้ารหัส password
  //   const encryptedPassword = await bcrypt.hash(password, 10);

  //   // 4) สร้าง user
  //   const newUser = {
  //     username,
  //     password: encryptedPassword,
  //     createdAt: new Date().toISOString(),
  //   };

  //   const result = await userSchema.insertOne(newUser);

  //   // 5) สร้าง Token
  //   const token = jwt.sign(
  //     { user_id: result.insertedId, username },
  //     process.env.TOKEN_KEY, // ตรวจสอบว่ามีค่าใน .env
  //     { expiresIn: "1d" }
  //   );

  //   // 6) ใส่ token ลงใน user object
  //   newUser.token = token;

  //   // 7) ส่งกลับโดยตัด password ออก
  //   const { password: _, ...userWithoutPassword } = newUser;
  //   res.status(201).json(userWithoutPassword);
  // } catch (err) {
  //   console.error("Register Error:", err);
  //   res.status(500).send("Internal Server Error");
  // }
  const { username, password, email } = req.body;

  // 1) Validate Input
  if (!username || !password || !email) {
    return res.status(400).send("All input is required");
  }

  try {
    let errors = {};
    // 2) Check if the user already exists (by username and email)
    const oldUserByUsername = await userSchema.findOne({
      username: username.toLowerCase(),
    });
    if (oldUserByUsername) {
      errors.username = "User already exists, please login.";
      // return res.status(409).send("User already exists, please login.");
    }

    const oldUserByEmail = await userSchema.findOne({
      email: email.toLowerCase(),
    });
    if (oldUserByEmail) {
      errors.email = "Email is already registered, please use another email.";
      // return res.status(409).send("Email is already registered, please use another email.");
    }

    if (Object.keys(errors).length > 0) {
      return res.status(409).json(errors);
    }

    // 3) Hash the password
    const encryptedPassword = await bcrypt.hash(password, 10);

    // 4) Create new user object
    const newUser = {
      username: username.toLowerCase(),
      password: encryptedPassword,
      email: email.toLowerCase(), // Store the user's email
      createdAt: new Date().toISOString(),
    };

    // 5) Insert the new user into the database
    const result = await userSchema.insertOne(newUser);

    // 6) Create JWT token
    const token = jwt.sign(
      { user_id: result.insertedId, username },
      process.env.TOKEN_KEY, // Ensure TOKEN_KEY is set in your environment variables
      { expiresIn: "1d" }
    );

    // 7) Add the token to the user object
    newUser.token = token;

    // 8) Remove the password before sending the response
    const { password: _, ...userWithoutPassword } = newUser;

    // 9) Send email notification to the user
    const mailOptions = {
      from: "sit.invest.pl3@gmail.com", // Sender's email address
      to: email, // User's email address
      subject: "SIT Invest Registration", // Email subject
      text: `Your registration with email ${email} was successful. Welcome to SIT Invest!`, // Email body
    };

    // Send the email and handle any errors
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        // Ensure the registration response is sent only if the email is sent successfully
        return res.status(500).send("Failed to send confirmation email.");
      } else {
        console.log("Email sent: " + info.response);
        // Send back the user object without password if email is sent successfully
        res.status(201).json(userWithoutPassword);
      }
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

//Login
router.post("/login", async (req, res) => {
  // const { username, password } = req.body;

  // // ตรวจสอบว่ามี username และ password มาหรือไม่
  // if (!username || !password) {
  //   return res.status(400).send("All input is required");
  // }

  // try {
  //   // ค้นหา user จากฐานข้อมูล
  //   const user = await userSchema.findOne({ username });
  //   if (!user) {
  //     return res.status(400).send("Invalid Credentials");
  //   }

  //   // ตรวจสอบความถูกต้องของรหัสผ่าน
  //   const isPasswordValid = await bcrypt.compare(password, user.password);
  //   if (!isPasswordValid) {
  //     return res.status(400).send("Invalid Credentials");
  //   }

  //   // สร้าง JWT token
  //   const token = jwt.sign(
  //     { user_id: user._id, username },
  //     process.env.TOKEN_KEY,
  //     { expiresIn: "1d" }
  //   );

  //   // ใส่ token ลงใน user object
  //   user.token = token;

  //   // ส่งกลับข้อมูล user โดยไม่แสดงรหัสผ่าน
  //   const { password: pwd, ...userWithoutPassword } = user;
  //   res.status(200).json(userWithoutPassword);
  // } catch (err) {
  //   console.error("Login Error:", err);
  //   res.status(500).send("Internal Server Error");
  // }
  let { username, email, password } = req.body;

  // ตรวจสอบว่าได้รับ password หรือไม่ และต้องมี username หรือ email อย่างน้อยหนึ่งอย่าง
  if (!password || (!username && !email)) {
    return res.status(400).send("Username or Email and Password are required");
  }

  try {
    let user;

    // ทำให้ username และ email เป็น lowercase
    if (username) username = username.toLowerCase();
    if (email) email = email.toLowerCase();

    if (username) {
      // ค้นหา user ด้วย username (เป็น lowercase)
      user = await userSchema.findOne({ username: username.toLowerCase() });
      if (user && !email) {
        email = user.email; // ถ้า user มี email ให้ใช้จากฐานข้อมูล
      }
    } else if (email) {
      // ค้นหา user ด้วย email (เป็น lowercase)
      user = await userSchema.findOne({ email: email.toLowerCase() });
      if (user && !username) {
        username = user.username; // ถ้า user มี username ให้ใช้จากฐานข้อมูล
      }
    }

    // ถ้า user ไม่ถูกพบ
    if (!user) {
      return res.status(400).send("Invalid Credentials");
    }

    // ตรวจสอบความถูกต้องของรหัสผ่าน
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).send("Invalid Credentials");
    }

    // สร้าง JWT token ใส่ username และ email (เป็น lowercase)
    const token = jwt.sign(
      { user_id: user._id, username, email },
      process.env.TOKEN_KEY,
      { expiresIn: "1d" }
    );

    // ส่งกลับข้อมูล user โดยไม่แสดงรหัสผ่าน
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ ...userWithoutPassword, token });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
