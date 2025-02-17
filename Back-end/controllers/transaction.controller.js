import * as transactionService from "../services/transaction.service.js";
import * as transactionModel from "../models/transaction.model.js";

export const getAllTransactions = async (req, res, next) => {
  try {
    const transactions = await transactionModel.getAllTransactions();
    res.status(200).json(transactions);
  } catch (error) {
    next(error);
  }
};

export const createTransaction = async (req, res, next) => {
  const requiredFields = ["userId", "portId", "symbol", "action", "status", "totalAmount", "bidPrice", "actualPrice", "quantity"];
  const missingFields = requiredFields.filter(field => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({ message: "Missing required fields.", missingFields });
  }

  const expiredAt = new Date();
  expiredAt.setUTCHours(28, 0, 0, 0); // UTC+7 → ตี 4

  try {
    const newTransaction = { ...req.body, action: req.body.action.toLowerCase(), status: req.body.status.toLowerCase(), date: new Date().toISOString(), expiredAt: expiredAt.toISOString() };
    await transactionModel.createTransaction(newTransaction);
    if (newTransaction.status === "match") await transactionService.executeStockTransaction(newTransaction.action, newTransaction.portId, newTransaction.symbol, newTransaction.quantity, newTransaction.actualPrice);
    res.status(201).json({ message: "Transaction created successfully.", transaction: newTransaction });
  } catch (error) {
    next(error);
  }
};
