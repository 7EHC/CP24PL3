import * as tickerModel from "../models/ticker.model.js";
import appError from "../middleware/appError.js"

export const getAllTickersService = async () => {
  try {
    const tickers = await tickerModel.findAllTickers();
    if (tickers.length === 0) {
      throw new appError("No tickers found", 404); // ✅ ส่ง 404 ถ้าไม่มีหุ้นเลย
    }
    return tickers;
  } catch (error) {
    throw new appError("Database error while fetching tickers", 500);
  }
};

export const searchTickersService = async (identifier) => {
  if (!identifier) {
    throw new appError("Identifier is required for search.", 400);
  }

  try {
    const tickers = await tickerModel.searchTickers(identifier);

    if (!tickers || tickers.length === 0) {
      throw new appError(`No stocks found matching '${identifier}'`, 404);
    }

    return tickers;
  } catch (error) {
    if (error.name === "MongoServerError" || error.name === "MongoNetworkError") {
      throw new appError("Database error while searching tickers", 500);
    }
    throw error;
  }
};

