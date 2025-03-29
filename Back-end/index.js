import express from "express";
import cors from "cors";
import "./config/dotenv.js";
import "express-async-errors";
import myRouter from "./routes/myRoute.js"
import reportRouter from "./routes/report.js"
import verify from "./routes/verify.js"
import cookieParser from "cookie-parser";
// import path from "path";

const PORT = process.env.PORT || 5050;
const app = express()

app.use(cookieParser());

// app.use((req,res)=>{
//     res.end("<h1>Hello world!</h1>")
// })

const allowedOrigins = [
    "http://localhost:5173", 
    "https://capstone24.sit.kmutt.ac.th/pl3"
  ];
  
  app.use(cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }));

// app.use(cors({
//     origin: process.env.CLIENT_URL || "http://localhost:5173",
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
//     credentials: true,
// }));
app.use(express.json()); // Enable JSON body parsing middleware

// Load myRoute routes
app.use('/api', myRouter);

// app.use('/public', express.static(path.join(process.cwd(), 'public')));

// Load report.js routes
app.use("/test", reportRouter);

app.use("/verify", verify)

app.use(express.urlencoded({ extended: true }));

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
})
