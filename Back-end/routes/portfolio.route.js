import express from "express";
import * as portfolioController from "../controllers/portfolio.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/portfolios", portfolioController.getAllPortfolios);
router.get("/portDetails/:portId", portfolioController.getPortfolioById); 
router.post("/portfolios/create", portfolioController.createPortfolio);
router.post("/portfolios/buy", portfolioController.buyStock);
router.post("/portfolios/sell",  portfolioController.sellStock)

export default router;
