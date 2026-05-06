class FinanceController {
  constructor(service) {
    this.service = service;
  }

  getAllRecords = async (req, res) => {
    try {
      const filters = {
        type: req.query.type,
        category: req.query.category,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };
      const records = await this.service.getAllRecords(filters);

      return res.render("transaction", {
        transactions: records,
        query: req.query,
      });
    } catch (error) {
      console.error("Error fetching all records:", error);
      return res.status(500).send("Failed to fetch records");
    }
  };

  getRecordById = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).send("Некоректний ID");

      const result = await this.service.getRecordById(id);
      if (!result) return res.status(404).send("Запис не знайдено");

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching record by ID:", error);
      return res.status(500).send("Failed to fetch record");
    }
  };

  getEditPage = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).send("Некоректний ID");

      const record = await this.service.getRecordById(id);

      if (!record) {
        return res.status(404).send("Запис не знайдено");
      }

      return res.render("form", { record });
    } catch (error) {
      console.error("Error fetching record for edit:", error);
      return res.status(500).send("Failed to load edit page");
    }
  };

  createRecord = async (req, res) => {
    try {
      const amount = Number(req.body.amount);
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).send("Сума повинна бути додатнім числом");
      }

      const data = {
        amount,
        purchase: req.body.purchase,
        category: req.body.category,
        type: req.body.type,
      };

      await this.service.createRecord(data);
      return res.redirect("/transactions");
    } catch (error) {
      console.error("Error creating record:", error);
      return res
        .status(500)
        .json({ message: "Failed to create record", error: error.message });
    }
  };

  updateRecord = async (req, res) => {
    try {
      const id = Number(req.params.id);
      const amount = Number(req.body.amount);

      if (isNaN(id) || isNaN(amount)) {
        return res.status(400).send("Некоректні дані");
      }

      const data = {
        amount,
        purchase: req.body.purchase,
        category: req.body.category,
        type: req.body.type,
      };

      await this.service.updateRecord(id, data);

      return res.redirect("/transactions");
    } catch (error) {
      console.error("Error updating record:", error);
      return res.status(500).send("Failed to update record");
    }
  };

  deleteRecord = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).send("Некоректний ID");
      
      await this.service.deleteRecord(id);
      return res.redirect("/transactions");
    } catch (error) {
      console.error("Error deleting record:", error);
      return res
        .status(500)
        .json({ message: "Failed to delete record", error: error.message });
    }
  };

  replaceRecord = async (req, res) => {
    try {
      const oldId = Number(req.params.id);
      if (isNaN(oldId)) return res.status(400).send("Некоректний ID");

      const { newTransaction1, newTransaction2 } = req.body;

      await this.service.replaceTransaction(oldId, newTransaction1, newTransaction2);
      
      return res.status(200).json({ message: "Транзакція успішно замінена" });
    } catch (error) {
      console.error("Transaction failed and rolled back:", error);
      return res.status(500).json({ message: "Помилка транзакції, зміни відкочено", error: error.message });
    }
  };
}

export default FinanceController;
