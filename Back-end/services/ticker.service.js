import * as tickerModel from "../models/ticker.model.js";

export const getAllTickersService = async () => {
  return tickerModel.findAllTickers();
};

export const searchTickersService = async (identifier) => {
  return tickerModel.searchTickers(identifier);
};
