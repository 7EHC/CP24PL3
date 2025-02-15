import { ObjectId } from "mongodb";
import * as portfolioModel from "../models/portfolio.model.js";

export const createPortfolioService = async (portfolioName, assets) => {
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
  const portId = new ObjectId(portIdStr);
  return portfolioModel.findPortfolioById(portId);
};

export const buyStockService = async (portIdStr, symbol, quantity, current_mkt_price) => {
  const portId = new ObjectId(portIdStr);
  const portfolio = await portfolioModel.findPortfolioById(portId);
  if (!portfolio) {
    throw new Error("Portfolio not found");
  }

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
};

export const sellStockService = async (portIdStr, symbol, quantity, current_mkt_price) => {
  const portId = new ObjectId(portIdStr);
  const portfolio = await portfolioModel.findPortfolioById(portId);
  if (!portfolio) {
    throw new Error("Portfolio not found");
  }

  const asset = portfolio.assets.find((asset) => asset.name === symbol);
  if (!asset) {
    throw new Error("Asset not found in portfolio");
  }
  if (quantity > asset.quantity) {
    throw new Error(`Quantity to sell (${quantity}) exceeds available (${asset.quantity})`);
  }

  await portfolioModel.updatePortfolio(
    { _id: portId, "assets.name": symbol },
    { $inc: { "assets.$.quantity": -quantity } }
  );
  // ตรวจสอบว่า asset มีจำนวนเหลือหรือไม่
  const updatedPortfolio = await portfolioModel.findPortfolioById(portId);
  const updatedAsset = updatedPortfolio.assets.find((asset) => asset.name === symbol);
  if (updatedAsset && updatedAsset.quantity <= 0) {
    await portfolioModel.deleteAssetFromPortfolio(portId, symbol);
  }
  return;
};
