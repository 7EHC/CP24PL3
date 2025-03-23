import express from "express";
import cors from "cors";
import "./config/dotenv.js";
import "express-async-errors";
import myRouter from "./routes/myRoute.js"
import reportRouter from "./routes/report.js"
import verify from "./routes/verify.js"
// import path from "path";

const PORT = process.env.PORT || 5050;
const app = express()

// app.use((req,res)=>{
//     res.end("<h1>Hello world!</h1>")
// })

app.use(cors());
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
