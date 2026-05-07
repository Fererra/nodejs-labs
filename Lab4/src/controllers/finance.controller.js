class FinanceController {
  constructor(service) {
    this.service = service;
  }

  _handleDbError(res, error) {
    console.error("Database error:", error.message);

    switch (error.code) {
      case "23503":
        return res.status(409).render("error", {
          statusCode: 409,
          message: "Неможливо виконати операцію: запис пов'язаний з іншими даними",
        });

      case "23505":
        return res.status(409).render("error", {
          statusCode: 409,
          message: "Запис з такими даними вже існує",
        });

      case "23514":
        return res.status(400).render("error", {
          statusCode: 400,
          message: "Дані не відповідають обмеженням бази даних (наприклад, невірний тип транзакції)",
        });

      case "23502":
        return res.status(400).render("error", {
          statusCode: 400,
          message: "Не заповнені обов'язкові поля",
        });

      default:
        return res.status(500).render("error", {
          statusCode: 500,
          message: "Внутрішня помилка сервера",
        });
    }
  }

  _formatRecords(rows) {
    return rows.map((row) => ({
      ...row,
      date:
        row.date instanceof Date
          ? row.date.toISOString().split("T")[0]
          : row.date,
      amount: Number(row.amount),
    }));
  }

  getAllRecords = async (req, res) => {
    try {
      const filters = {
        type: req.query.type || undefined,
        category: req.query.category || undefined,
        startDate: req.query.startDate || undefined,
        endDate: req.query.endDate || undefined,
      };

      const records = await this.service.getAllRecords(filters);

      return res.render("transaction", {
        transactions: this._formatRecords(records),
        query: req.query,
      });
    } catch (error) {
      return this._handleDbError(res, error);
    }
  };

  getRecordById = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).render("error", {
          statusCode: 400,
          message: "Некоректний ID",
        });
      }

      const result = await this.service.getRecordById(id);
      if (!result) {
        return res.status(404).render("error", {
          statusCode: 404,
          message: "Запис не знайдено",
        });
      }

      return res.status(200).json(result);
    } catch (error) {
      return this._handleDbError(res, error);
    }
  };

  getEditPage = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).render("error", {
          statusCode: 400,
          message: "Некоректний ID",
        });
      }

      const record = await this.service.getRecordById(id);

      if (!record) {
        return res.status(404).render("error", {
          statusCode: 404,
          message: "Запис не знайдено",
        });
      }

      if (record.date instanceof Date) {
        record.date = record.date.toISOString().split("T")[0];
      }
      record.amount = Number(record.amount);

      return res.render("form", { record });
    } catch (error) {
      return this._handleDbError(res, error);
    }
  };

  createRecord = async (req, res) => {
    try {
      const amount = Number(req.body.amount);
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).render("error", {
          statusCode: 400,
          message: "Сума повинна бути додатнім числом",
        });
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
      return this._handleDbError(res, error);
    }
  };

  updateRecord = async (req, res) => {
    try {
      const id = Number(req.params.id);
      const amount = Number(req.body.amount);

      if (isNaN(id) || isNaN(amount)) {
        return res.status(400).render("error", {
          statusCode: 400,
          message: "Некоректні дані",
        });
      }

      const existing = await this.service.getRecordById(id);
      if (!existing) {
        return res.status(404).render("error", {
          statusCode: 404,
          message: "Запис для оновлення не знайдено",
        });
      }

      const data = {
        amount,
        purchase: req.body.purchase,
        category: req.body.category,
        type: req.body.type,
        date: existing.date instanceof Date
          ? existing.date.toISOString().split("T")[0]
          : existing.date,
      };

      await this.service.updateRecord(id, data);

      return res.redirect("/transactions");
    } catch (error) {
      return this._handleDbError(res, error);
    }
  };

  deleteRecord = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).render("error", {
          statusCode: 400,
          message: "Некоректний ID",
        });
      }

      const deleted = await this.service.deleteRecord(id);

      if (!deleted) {
        return res.status(404).render("error", {
          statusCode: 404,
          message: "Запис для видалення не знайдено",
        });
      }

      return res.redirect("/transactions");
    } catch (error) {
      return this._handleDbError(res, error);
    }
  };

  replaceRecord = async (req, res) => {
    try {
      const oldId = Number(req.params.id);
      if (isNaN(oldId)) {
        return res.status(400).render("error", {
          statusCode: 400,
          message: "Некоректний ID",
        });
      }

      const { newTransaction1, newTransaction2 } = req.body;

      await this.service.replaceTransaction(
        oldId,
        newTransaction1,
        newTransaction2,
      );

      return res.status(200).json({ message: "Транзакція успішно замінена" });
    } catch (error) {
      console.error("Transaction failed and rolled back:", error);

      if (error.code) {
        return this._handleDbError(res, error);
      }

      return res.status(500).json({
        message: "Помилка транзакції, зміни відкочено",
        error: error.message,
      });
    }
  };

  reassignCategoryTransactions = async (req, res) => {
    try {
      const { oldCategory, newCategory } = req.body;
      if (!oldCategory) {
        return res.status(400).render("error", {
          statusCode: 400,
          message: "Не вказано стару категорію для перенесення",
        });
      }
      const result = await this.service.reassignCategory(oldCategory, newCategory);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Помилка під час масового перенесення категорій:", error);
      if (error.message.includes('Відміна транзакції') || error.message.includes('не знайдено')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      return res.status(500).json({
        success: false,
        message: "Помилка транзакції, зміни відкочено",
        error: error.message,
      });
    }
  };
}

export default FinanceController;
