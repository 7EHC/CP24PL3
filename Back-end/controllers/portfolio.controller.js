import * as portfolioService from "../services/portfolio.service.js";

export const createPortfolio = async (req, res, next) => {
  try {
    const { portfolio_name, assets } = req.body;
    if (!portfolio_name || !assets) {
      throw { statusCode: 400, message: "Please provide portfolio name and assets." };
    }
    const result = await portfolioService.createPortfolioService(portfolio_name, assets);
    res.status(201).json({
      message: "Portfolio created successfully.",
      portfolio: {
        _id: result.insertedId,
        portfolio_name,
        assets,
      },
    });
  } catch (error) {
    next(error); // ✅ Send error to middleware
  }
};

export const getAllPortfolios = async (req, res, next) => {
  try {
    const portfolios = await portfolioService.getAllPortfoliosService();
    res.status(200).json(portfolios);
  } catch (error) {
    next(error);
  }
};

export const getPortfolioById = async (req, res, next) => {
  try {
    const { portId } = req.params;
    if (!portId) {
      throw { statusCode: 400, message: "Portfolio ID is required." };
    }
    const portfolio = await portfolioService.getPortfolioByIdService(portId);
    if (!portfolio) {
      throw { statusCode: 404, message: "Portfolio not found." };
    }
    res.status(200).json(portfolio);
  } catch (error) {
    next(error);
  }
};

export const buyStock = async (req, res, next) => {
  try {
    const { _id, symbol, quantity, current_mkt_price } = req.body;
    if (!_id || !symbol || !quantity || !current_mkt_price) {
      throw { statusCode: 400, message: "Please provide all required stock purchase details." };
    }
    await portfolioService.buyStockService(_id, symbol, quantity, current_mkt_price);
    res.status(200).json({ message: "Stock purchased successfully." });
  } catch (error) {
    next(error);
  }
};

export const sellStock = async (req, res, next) => {
  try {
    const { _id, symbol, quantity, current_mkt_price } = req.body;
    if (!_id || !symbol || !quantity || !current_mkt_price) {
      throw { statusCode: 400, message: "Please provide all required stock sale details." };
    }
    await portfolioService.sellStockService(_id, symbol, quantity, current_mkt_price);
    res.status(200).json({ message: "Stock sold successfully." });
  } catch (error) {
    next(error);
  }
};
