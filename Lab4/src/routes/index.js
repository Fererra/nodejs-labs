import { Router } from "express";
import TransactionRepository from "../repositories/transaction.repository.js";
import FinanceService from "../services/finance.service.js";
import FinanceController from "../controllers/finance.controller.js";
import pool from "../../config/database.js";

const router = Router();

const transaction = new TransactionRepository(pool);
const service = new FinanceService(transaction);
const controller = new FinanceController(service);

router.get("/", (req, res) => {
  res.render("index");
});

router.get("/add-record-page", (req, res) => {
  res.render("form", { record: null });
});

router.get("/categories", controller.getReassignCategoryPage);

router.post("/save", controller.createRecord);
router.get("/transactions", controller.getAllRecords);
router.get("/transaction/:id", controller.getRecordById);
router.get("/edit/:id", controller.getEditPage);
router.post("/edit/:id", controller.updateRecord);
router.post("/delete/:id", controller.deleteRecord);
router.post("/categories/reassign", controller.reassignCategory);

export default router;
