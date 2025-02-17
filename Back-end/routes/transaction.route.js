import express from "express";
import * as transactionController from "../controllers/transaction.controller.js";

const router = express.Router();
router.get("/transaction", transactionController.getAllTransactions);
router.post("/transaction/create", transactionController.createTransaction);

export default router;
