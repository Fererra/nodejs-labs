import { Router } from "express";
const router = Router();

import { getTransactions } from '../controllers/TransactionController.js';
router.get('/transactions', getTransactions);

export default router;
