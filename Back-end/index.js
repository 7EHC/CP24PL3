import express from "express";
import cors from "cors";
import "./config/dotenv.js";
import "express-async-errors";
import myRouter from "./routes/myRoute.js"

const PORT = process.env.PORT || 5050;
const app = express()

// app.use((req,res)=>{
//     res.end("<h1>Hello world!</h1>")
// })

app.use(cors());
app.use(express.json()); // Enable JSON body parsing middleware

// Load myRoute routes
app.use('/stock', myRouter);
app.use(express.urlencoded({ extended: true }));

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
})