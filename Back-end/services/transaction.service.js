import fetch from "node-fetch";
import * as transactionModel from "../models/transaction.model.js";
import cron from "node-cron";

const keyPool = [
    '609e212acea948feb7450938a016c088',
      '6b589bf0b3464cddbb59539a6c3d8238',
      'bae5aebed6024ffc9bd8118d9f3ef89a',
      'ac2e2c88ebac496d90b92b225aefd4b4',
      'a812690526f24184b0347c0ce8899b8b',
      '96226cc340d647458a8ee8415757f722'
  ];
let keyIndex = 0;
const getNextApiKey = () => keyPool[keyIndex++ % keyPool.length];

export const executeStockTransaction = async (action, _id, symbol, quantity, current_mkt_price) => {
  try {
    const apiUrl = action === "buy"
      ? "http://localhost:5000/api/portfolios/buy"
      : "http://localhost:5000/api/portfolios/sell";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id, symbol, quantity, current_mkt_price }),
    });

    if (!response.ok) throw new Error(`Failed to execute ${action} transaction`);
    console.log(`✅ ${action.toUpperCase()} transaction executed successfully.`);
  } catch (error) {
    console.error(`⚠️ Error executing ${action} transaction:`, error);
  }
};


export const processPendingTransactions = async () => {
  const now = new Date();
//   if ([0, 6].includes(now.getDay()) || !(now.getHours() >= 20 || now.getHours() < 4)) return;

  console.log(`🔄 Checking pending transactions... at ${now}`);
  const pendingTrans = await transactionModel.getPendingTransactions();

  for (const trans of pendingTrans) {
    const { _id, portId, symbol, bidPrice, action, expiredAt, quantity } = trans;
    try {
        
      if (new Date() >= new Date(expiredAt)) {
        await transactionModel.updateTransactionStatus(_id, "failed");
        continue;
      }
      const apiKey = getNextApiKey();
      const res = await fetch(`https://api.twelvedata.com/time_series?apikey=${apiKey}&symbol=${symbol}&interval=1min`);
      const data = await res.json();
      if (!data.values?.length) continue;

      const marketPrice = parseFloat(data.values[0].close);
      if ((action === "buy" && marketPrice <= bidPrice) || (action === "sell" && marketPrice >= bidPrice)) {
        console.log('hey')
        await transactionModel.updateTransactionStatus(_id, "match", marketPrice);
        await executeStockTransaction(action, portId, symbol, quantity, marketPrice);
      }
    } catch (error) {
      console.error(`⚠️ Error processing transaction ${_id}:`, error);
    }
  }
};
cron.schedule("*/1 * * * *", processPendingTransactions);