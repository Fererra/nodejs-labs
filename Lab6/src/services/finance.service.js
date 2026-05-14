import { transactionManager } from "../db/transaction-manager.js";

class FinanceService {
  constructor(financeRepository) {
    this.repository = financeRepository;
  }

  async getAllCategories() {
    return await this.repository.getAllCategories();
  }

  async getAllTypes() {
    return await this.repository.getAllTypes();
  }

  async getAllRecords(filters = {}, paginationInput = {}) {
    const pagination = {
      page: paginationInput.page || 1,
      limit: paginationInput.limit || 10,
    };

    const allowedFilters = ["type", "category", "startDate", "endDate"];

    const hasFilters = allowedFilters.some(
      (param) => filters[param] !== undefined && filters[param] !== "",
    );

    if (hasFilters) {
      return await this.repository.getFiltered({ ...filters, ...pagination });
    }

    return await this.repository.getAll(pagination);
  }

  async getRecordById(id) {
    return await this.repository.getById(id);
  }

  async createRecord(data) {
    return await transactionManager.execute(async (t) => {
      const categoryId = await this.repository.findOrCreateCategory(
        data.category,
        t,
      );

      const dateId = await this.repository.findOrCreateDate(
        new Date().toISOString().split("T")[0],
        t,
      );

      const typeId = await this.repository.getTypeIdByName(data.type, t);

      return await this.repository.save(
        {
          amount: data.amount,
          purchase: data.purchase,
          categoryId,
          typeId,
          dateId,
        },
        t,
      );
    });
  }

  async updateRecord(id, data) {
    return await transactionManager.execute(async (t) => {
      const categoryId = await this.repository.findOrCreateCategory(
        data.category,
        t,
      );
      const typeId = await this.repository.getTypeIdByName(data.type, t);

      return await this.repository.update(
        id,
        {
          amount: data.amount,
          purchase: data.purchase,
          categoryId,
          typeId,
        },
        t,
      );
    });
  }

  async deleteRecord(id) {
    return await transactionManager.execute(async (t) => {
      return await this.repository.delete(id, t);
    });
  }

  async reassignCategory(oldCategoryName, newCategoryName = "Uncategorized") {
    return await transactionManager.execute(async (t) => {
      if (oldCategoryName.toLowerCase() === "зарплата") {
        throw new Error(
          `System category '${oldCategoryName}' cannot be deleted!`,
        );
      }

      const oldCat = await this.repository.getCategoryByName(
        oldCategoryName,
        t,
      );
      if (!oldCat) {
        throw new Error(`Category '${oldCategoryName}' not found.`);
      }

      const newCatId = await this.repository.findOrCreateCategory(
        newCategoryName,
        t,
      );

      if (oldCat.id !== newCatId) {
        const updatedCount = await this.repository.updatePurchaseCategory(
          oldCat.id,
          newCatId,
          t,
        );

        await this.repository.deleteCategoryById(oldCat.id, t);

        return {
          success: true,
          message: `Moved ${updatedCount} records and deleted old category '${oldCategoryName}'.`,
        };
      }

      return { success: true, message: "Nothing to change." };
    });
  }
}

export default FinanceService;
