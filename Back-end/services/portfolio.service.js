import { ObjectId } from "mongodb";
import * as portfolioModel from "../models/portfolio.model.js";
import appError from "../middleware/appError.js"


export const createPortfolioService = async (portfolioName, assets) => {
  if (!portfolioName || !Array.isArray(assets)) {
    throw new appError("Invalid portfolio data", 400);
  }

  const newPortfolio = {
    portfolio_name: portfolioName,
    assets,
    createdAt: new Date(),
  };
  return portfolioModel.createPortfolio(newPortfolio);
};

export const getAllPortfoliosService = async () => {
  return portfolioModel.findAllPortfolios();
};

export const getPortfolioByIdService = async (portIdStr) => {
  if (!ObjectId.isValid(portIdStr)) {
    throw new appError("Invalid portfolio ID format", 400);
  }
  const portId = new ObjectId(portIdStr);
  const portfolio = await portfolioModel.findPortfolioById(portId);
  if (!portfolio) {
    throw new appError("Portfolio not found", 404);
  }
  return portfolio;
};

export const buyStockService = async (portIdStr, symbol, quantity, current_mkt_price) => {
  if (!ObjectId.isValid(portIdStr)) {
    throw new appError("Invalid portfolio ID format", 400);
  }
  if (!symbol || !quantity || !current_mkt_price) {
    throw new appError("Missing required stock purchase data", 400);
  }

  const portId = new ObjectId(portIdStr);
  const portfolio = await portfolioModel.findPortfolioById(portId);
  if (!portfolio) {
    throw new appError("Portfolio not found", 404);
  }

  try {
    const assetExists = portfolio.assets.some((asset) => asset.name === symbol);
    if (assetExists) {
      return portfolioModel.updatePortfolio(
        { _id: portId },
        { $inc: { "assets.$[elem].quantity": quantity } },
        { arrayFilters: [{ "elem.name": symbol }] }
      );
    } else {
      const newAsset = {
        name: symbol,
        quantity,
        current_mkt_price,
        purchased_at: new Date(),
      };
      return portfolioModel.updatePortfolio(
        { _id: portId },
        { $push: { assets: newAsset } }
      );
    }
  } catch (error) {
    throw new appError("Database error while buying stock", 500);
  }
};

export const sellStockService = async (portIdStr, symbol, quantity, current_mkt_price) => {
  if (!ObjectId.isValid(portIdStr)) {
    throw new appError("Invalid portfolio ID format", 400);
  }
  if (!symbol || !quantity || !current_mkt_price) {
    throw new appError("Missing required stock sale data", 400);
  }

  const portId = new ObjectId(portIdStr);
  const portfolio = await portfolioModel.findPortfolioById(portId);
  if (!portfolio) {
    throw new appError("Portfolio not found", 404);
  }

  const asset = portfolio.assets.find((asset) => asset.name === symbol);
  if (!asset) {
    throw new appError("Asset not found in portfolio", 404);
  }
  if (quantity > asset.quantity) {
    throw new appError(`Quantity to sell (${quantity}) exceeds available (${asset.quantity})`, 400);
  }

  try {
    await portfolioModel.updatePortfolio(
      { _id: portId, "assets.name": symbol },
      { $inc: { "assets.$.quantity": -quantity } }
    );

    const updatedPortfolio = await portfolioModel.findPortfolioById(portId);
    const updatedAsset = updatedPortfolio.assets.find((asset) => asset.name === symbol);
    if (updatedAsset && updatedAsset.quantity <= 0) {
      await portfolioModel.deleteAssetFromPortfolio(portId, symbol);
    }
    return;
  } catch (error) {
    throw new appError("Database error while selling stock", 500);
  }
};
