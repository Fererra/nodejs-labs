import { Router } from "express";
import TransactionRepository from "../repositories/transaction.repository.js";
import FinanceService from "../services/finance.service.js";
import FinanceController from "../controllers/FinanceController.js"; 

const router = Router();

const transaction = new TransactionRepository();
const service = new FinanceService(transaction);
const controller = new FinanceController(service);

router.get("/", (req, res)=>{
    res.render("index")
})

router.get("/add-record-page", (req, res)=>{
    res.render("form")
})

router.post("/save", controller.createRecord)

router.get("/transactions", controller.getAllRecords.bind(controller));

router.get("/transaction/:id", controller.getRecordById)

router.post("/delete/:id", controller.deleteRecord)

// Тут підключаємо інші роутери, коли вони будуть створені.
// Наприклад: const financeRouter = require('./finance');
// router.use('/finance', financeRouter);


export default router;
