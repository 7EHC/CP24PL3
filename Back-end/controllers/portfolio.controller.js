import * as portfolioService from "../services/portfolio.service.js";

export const createPortfolio = async (req, res, next) => {
  try {
    const { portfolio_name, assets } = req.body;
    if (!portfolio_name || !Array.isArray(assets)) {
      throw { statusCode: 400, message: "กรุณากรอกชื่อพอร์ตและข้อมูลหุ้น (assets ต้องเป็น array)" };
    }
    const result = await portfolioService.createPortfolioService(portfolio_name, assets);
    res.status(201).json({
      message: "พอร์ตถูกสร้างสำเร็จ",
      portfolio: {
        _id: result.insertedId,
        portfolio_name,
        assets,
      },
    });
  } catch (error) {
    next(error);
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
