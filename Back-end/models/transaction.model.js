import db from "../config/database.js";
const transaction = db.collection("transaction");

export const getAllTransactions = async () => {
  return await transaction.find({}).sort({ date: -1 }).toArray();
};

export const createTransaction = async (newTransaction) => {
  return await transaction.insertOne(newTransaction);
};

export const getPendingTransactions = async () => {
  return await transaction.find({ status: "pending" }).toArray();
};

export const updateTransactionStatus = async (_id, status, actualPrice = null) => {
  const updateData = { status };
  if (actualPrice) updateData.actualPrice = actualPrice;
  return await transaction.updateOne({ _id }, { $set: updateData });
};