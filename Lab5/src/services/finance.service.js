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

  async getAllRecords(filters = {}) {
    const hasFilters =
      filters.type || filters.category || filters.startDate || filters.endDate;
    if (hasFilters) {
      return await this.repository.getFiltered(filters);
    }
    return await this.repository.getAll();
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
          `Transaction cancelled: system category '${oldCategoryName}' cannot be changed!`,
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

      const updatedCount = await this.repository.updatePurchaseCategory(
        oldCat.id,
        newCatId,
        t,
      );

      return {
        success: true,
        message: `Transaction successful! Moved ${updatedCount} records from '${oldCategoryName}' to '${newCategoryName}'.`,
      };
    });
  }
}

export default FinanceService;
