class FinanceController {
  constructor(service) {
    this.service = service;
  }

  _handleDbError(res, error) {
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(409).render("error", {
        statusCode: 409,
        message: "Cannot perform operation: record is linked to other data",
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).render("error", {
        statusCode: 409,
        message: "A record with these data already exists",
      });
    }

    if (error.name === "SequelizeValidationError") {
      return res.status(400).render("error", {
        statusCode: 400,
        message: "Data do not meet database constraints",
      });
    }

    if (
      error.name === "SequelizeDatabaseError" &&
      error.parent &&
      error.parent.code === "23502"
    ) {
      return res.status(400).render("error", {
        statusCode: 400,
        message: "Required fields are missing",
      });
    }

    return res.status(500).render("error", {
      statusCode: 500,
      message: "Internal server error",
    });
  }

  _formatRecords(rows) {
    return rows.map((row) => ({
      ...row,
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

      record.amount = Number(record.amount);

      return res.render("form", { record });
    } catch (error) {
      return this._handleDbError(res, error);
    }
  };

  getReassignCategoryPage = (req, res) => {
    return res.render("categories");
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
      if (error.name) {
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