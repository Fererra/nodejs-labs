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
    const id = Number(req.params.id);
    const result = await this.service.getRecordById(id);
    return res.status(200).json(result);
  };

  getEditPage = async (req, res) => {
    try {
      const id = Number(req.params.id);
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
      const data = {
        amount: Number(req.body.amount),
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

      const data = {
        amount: Number(req.body.amount),
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
      await this.service.deleteRecord(id);
      return res.redirect("/transactions");
    } catch (error) {
      console.error("Error deleting record:", error);
      return res
        .status(500)
        .json({ message: "Failed to delete record", error: error.message });
    }
  };
}

export default FinanceController;
