class FinanceRestController {
  constructor(financeService) {
    this.service = financeService;
  }

  getAll = async (req, res) => {
    try {
      const pagination = {
        page: req.query.page ? parseInt(req.query.page, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
      };
      
      const filters = {
        type: req.query.type,
        category: req.query.category,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      // Виклакаю метод студента 3 з фільтрами та пагінацією
      const data = await this.service.getAllRecords(filters, pagination);

      return res.status(200).json(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  getById = async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const transaction = await this.service.getRecordById(id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      return res.status(200).json(transaction);
    } catch (error) {
      console.error(`Error fetching transaction ${req.params.id}:`, error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  delete = async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      const deletedCount = await this.service.deleteRecord(id);

      if (!deletedCount) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      return res.status(204).send();

    } catch (error) {
      console.error(`Error deleting transaction ${req.params.id}:`, error);
      return res.status(500).json({
        message: "Internal Server Error",
        error: error.message
      });
    }
  };
}

export default FinanceRestController;