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
          message: "Cannot perform operation: record is linked to other data",
        });

      case "23505":
        return res.status(409).render("error", {
          statusCode: 409,
          message: "A record with these data already exists",
        });

      case "23514":
        return res.status(400).render("error", {
          statusCode: 400,
          message:
            "Data do not meet database constraints (for example, invalid transaction type)",
        });

      case "23502":
        return res.status(400).render("error", {
          statusCode: 400,
          message: "Required fields are missing",
        });

      default:
        return res.status(500).render("error", {
          statusCode: 500,
          message: "Internal server error",
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

      const categories = await this.service.getAllCategories();
      const types = await this.service.getAllTypes();

      return res.render("transaction", {
        transactions: this._formatRecords(records),
        query: req.query,
        categories,
        types,
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
          message: "Invalid ID",
        });
      }

      const result = await this.service.getRecordById(id);
      if (!result) {
        return res.status(404).render("error", {
          statusCode: 404,
          message: "Record not found",
        });
      }

      return res.status(200).json(result);
    } catch (error) {
      return this._handleDbError(res, error);
    }
  };

  getAddPage = async (req, res) => {
    try {
      const categories = await this.service.getAllCategories();
      const types = await this.service.getAllTypes();

      return res.render("form", {
        record: null,
        categories,
        types,
      });
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
          message: "Invalid ID",
        });
      }

      const record = await this.service.getRecordById(id);

      if (!record) {
        return res.status(404).render("error", {
          statusCode: 404,
          message: "Record not found",
        });
      }

      if (record.date instanceof Date) {
        record.date = record.date.toISOString().split("T")[0];
      }
      record.amount = Number(record.amount);

      const categories = await this.service.getAllCategories();
      const types = await this.service.getAllTypes();

      return res.render("form", {
        record,
        categories,
        types,
      });
    } catch (error) {
      return this._handleDbError(res, error);
    }
  };

  getReassignCategoryPage = async (req, res) => {
    try {
      const categories = await this.service.getAllCategories();
      return res.render("categories", { categories });
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
          message: "Amount must be a positive number",
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
          message: "Invalid data",
        });
      }

      const existing = await this.service.getRecordById(id);
      if (!existing) {
        return res.status(404).render("error", {
          statusCode: 404,
          message: "Record to update not found",
        });
      }

      const data = {
        amount,
        purchase: req.body.purchase,
        category: req.body.category,
        type: req.body.type,
        date:
          existing.date instanceof Date
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
          message: "Invalid ID",
        });
      }

      const deleted = await this.service.deleteRecord(id);

      if (!deleted) {
        return res.status(404).render("error", {
          statusCode: 404,
          message: "Record to delete not found",
        });
      }

      return res.redirect("/transactions");
    } catch (error) {
      return this._handleDbError(res, error);
    }
  };

  reassignCategory = async (req, res) => {
    try {
      const oldCategory = req.body.oldCategory?.trim();
      const newCategory = req.body.newCategory?.trim();

      if (!oldCategory) {
        return res.status(400).render("error", {
          statusCode: 400,
          message: "Old category is required",
        });
      }

      await this.service.reassignCategory(oldCategory, newCategory);

      return res.redirect("/transactions");
    } catch (error) {
      if (error.code) {
        return this._handleDbError(res, error);
      }
      return res.status(400).render("error", {
        statusCode: 400,
        message: error.message || "Error while changing category",
      });
    }
  };
}

export default FinanceController;
