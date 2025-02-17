import { Router } from "express";
import { getAllTickers, searchTickers } from "../controllers/stock.controller.js";

const router = Router();

router.get("/allticker", getAllTickers);
router.get("/searchTickers/:identifier", searchTickers);

export default router;
