import db from "../config/database.js";

const portfolioCollection = db.collection("portfolio");

export const createPortfolio = async (portfolio) => {
  return portfolioCollection.insertOne(portfolio);
};

export const findAllPortfolios = async () => {
  return portfolioCollection.find().toArray();
};

export const findPortfolioById = async (portId) => {
  return portfolioCollection.findOne({ _id: portId });
};

export const updatePortfolio = async (filter, update, options = {}) => {
  return portfolioCollection.updateOne(filter, update, options);
};

export const deleteAssetFromPortfolio = async (portId, symbol) => {
  return portfolioCollection.updateOne(
    { _id: portId },
    { $pull: { assets: { name: symbol } } }
  );
};
