import db from "../config/database.js";

const tickerCollection = db.collection("stock_ticker");

export const findAllTickers = async () => {
  return tickerCollection.find({}).toArray();
};

export const searchTickers = async (identifier) => {
  const projection = { projection: { _id: 0, ticker: 1, name: 1, market: 1, type: 1 } };
  const query = {
    $or: [
      { ticker: { $regex: `^${identifier}`, $options: 'i' } },
      { name: { $regex: `^${identifier}`, $options: 'i' } }
    ]
  };
  return tickerCollection.find(query, projection).toArray();
};
