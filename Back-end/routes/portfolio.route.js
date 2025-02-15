import { Router } from "express";
import { createPortfolio, getAllPortfolios, getPortfolioById, buyStock, sellStock } from "../controllers/portfolio.controller.js";
import auth from "../middleware/auth.js";

const router = Router();

router.post("/create", auth, createPortfolio);
router.get("/", auth, getAllPortfolios);
router.get("/portDetails/:portId", auth, getPortfolioById);
router.post("/buy", auth, buyStock);
router.post("/sell", auth, sellStock);

export default router;
