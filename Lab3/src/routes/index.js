import { Router } from "express";
import TransactionRepository from "../repositories/transaction.repository.js";
import FinanceService from "../services/finance.service.js";
import FinanceController from "../controllers/finance.controller.js";

const router = Router();

const transaction = new TransactionRepository();
const service = new FinanceService(transaction);
const controller = new FinanceController(service);

router.get("/", (req, res) => {
  res.render("index");
});

router.get("/add-record-page", controller.getAddPage);
router.post("/save", controller.createRecord);
router.get("/transactions", controller.getAllRecords);
router.get("/transactions/:id", controller.getRecordById);
router.get("/edit/:id", controller.getEditPage);
router.post("/edit/:id", controller.updateRecord);
router.post("/delete/:id", controller.deleteRecord);

export default router;
