import * as tickerService from "../services/ticker.service.js";

export const getAllTickers = async (req, res, next) => {
  try {
    const allTickers = await tickerService.getAllTickersService();
    res.status(200).json(allTickers);
  } catch (error) {
    console.error("Get All Tickers Error:", error);
    next({
      statusCode: error.statusCode || 500,
      message: error.message || "Internal Server Error",
      details: error.stack || "No additional details",
    });
  }
};

export const searchTickers = async (req, res, next) => {
  try {
    const identifier = req.params.identifier;
    if (!identifier) {
      throw { statusCode: 400, message: "Missing identifier for search" };
    }
    const tickers = await tickerService.searchTickersService(identifier);
    res.status(200).json(tickers);
  } catch (error) {
    console.error("Search Tickers Error:", error);
    next({
      statusCode: error.statusCode || 500,
      message: error.message || "Internal Server Error",
      details: error.stack || "No additional details",
    });
  }
};
