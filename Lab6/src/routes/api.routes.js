import { Router } from "express";
import FinanceRestController from "../controllers/finance-rest.controller.js";
import FinanceService from "../services/finance.service.js";
import TransactionRepository from "../repositories/transaction.repository.js";

const transactionRepo = new TransactionRepository();
const financeService = new FinanceService(transactionRepo);
const financeRestController = new FinanceRestController(financeService);

const router = Router();

router.get("/transactions", (req, res) =>
  financeRestController.getAll(req, res),
);

router.get("/transactions/:id", (req, res) =>
  financeRestController.getById(req, res),
);

router.post("/transactions", (req, res) =>
  financeRestController.create(req, res),
);

router.put("/transactions/:id", (req, res) =>
  financeRestController.update(req, res),
);

router.delete("/transactions/:id", (req, res) =>
  financeRestController.delete(req, res),
);

router.use((req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

export default router;
