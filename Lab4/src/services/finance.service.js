import { transactionManager } from "../db/transaction-manager.js";

class FinanceService {
  constructor(financeRepository) {
    this.repository = financeRepository;
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
    return await this.repository.save(data);
  }

  async updateRecord(id, data) {
    return await this.repository.update(id, data);
  }

  async deleteRecord(id) {
    return await this.repository.delete(id);
  }

  async reassignCategory(oldCategory, newCategory = "Uncategorized") {
    return await transactionManager.execute(async (client) => {
      if (oldCategory.toLowerCase() === "зарплата") {
        throw new Error(
          `Transaction cancelled: system category '${oldCategory}' cannot be changed!`,
        );
      }
      const updatedCount = await this.repository.updateCategoryTransactionally(
        oldCategory,
        newCategory,
        client,
      );
      if (updatedCount === 0) {
        throw new Error(
          `Category '${oldCategory}' not found, rolling back operation.`,
        );
      }
      return {
        success: true,
        message: `Transaction successful! Moved ${updatedCount} records.`,
      };
    });
  }
}

export default FinanceService;
