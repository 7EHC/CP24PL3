import express from "express";
import * as portfolioController from "../controllers/portfolio.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/portfolios", auth, portfolioController.getAllPortfolios);
router.get("/portDetails/:portId", auth, portfolioController.getPortfolioById); 
router.post("/portfolios/create", auth, portfolioController.createPortfolio);
router.post("/portfolios/buy", auth, portfolioController.buyStock);
router.post("/portfolios/sell", auth, portfolioController.sellStock)

export default router;
