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
    return await transactionManager.execute(async (client) => {
      const categoryId = await this.repository.findOrCreateCategory(
          data.category,
          client,
      );

      const dateId = await this.repository.findOrCreateDate(
          new Date().toISOString().split("T")[0],
          client,
      );

      const typeId = await this.repository.getTypeIdByName(data.type, client);

      return await this.repository.save(
          {
            amount: data.amount,
            purchase: data.purchase,
            categoryId,
            typeId,
            dateId,
          },
          client,
      );
    });
  }

  async updateRecord(id, data) {
    return await transactionManager.execute(async (client) => {
      const categoryId = await this.repository.findOrCreateCategory(
          data.category,
          client,
      );
      const typeId = await this.repository.getTypeIdByName(data.type, client);

      return await this.repository.update(
          id,
          {
            amount: data.amount,
            purchase: data.purchase,
            categoryId,
            type_id: typeId,
          },
          client,
      );
    });
  }

  async deleteRecord(id) {
    return await this.repository.delete(id);
  }

  async reassignCategory(oldCategoryName, newCategoryName = "Uncategorized") {
    return await transactionManager.execute(async (client) => {
      if (oldCategoryName.toLowerCase() === "зарплата") {
        throw new Error(
            `Transaction cancelled: system category '${oldCategoryName}' cannot be changed!`,
        );
      }

      const oldCat = await this.repository.getCategoryByName(
          oldCategoryName,
          client,
      );
      if (!oldCat) {
        throw new Error(`Category '${oldCategoryName}' not found.`);
      }

      const newCatId = await this.repository.findOrCreateCategory(
          newCategoryName,
          client,
      );

      const updatedCount = await this.repository.updatePurchaseCategory(
          oldCat.id,
          newCatId,
          client,
      );

      return {
        success: true,
        message: `Transaction successful! Moved ${updatedCount} records from '${oldCategoryName}' to '${newCategoryName}'.`,
      };
    });
  }
}

export default FinanceService;
