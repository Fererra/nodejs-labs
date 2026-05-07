import { transactionManager } from '../db/transactionManager.js';

class FinanceService {
  constructor(financeRepository) {
    this.repository = financeRepository;
  }

  async getAllRecords(filters = {}) {
    const hasFilters = filters.type || filters.category || filters.startDate || filters.endDate;
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

  async getTransactionsByCategory(category) {
    return await this.repository.filterByCategory(category);
  }

  async getTransactionsByPeriod(startDate, endDate) {
    return await this.repository.getByPeriod(startDate, endDate);
  }

  async reassignCategory(oldCategory, newCategory = 'Без категорії') {
    return await transactionManager.execute(async (client) => {
      if (oldCategory.toLowerCase() === 'зарплата') {
        throw new Error(`Відміна транзакції: системну категорію '${oldCategory}' не можна змінювати!`);
      }
      const updatedCount = await this.repository.updateCategoryTransactionally(oldCategory, newCategory, client);
      if (updatedCount === 0) {
        throw new Error(`Категорію '${oldCategory}' не знайдено, скасовуємо операцію.`);
      }
      return {
        success: true,
        message: `Транзакція успішна! Перенесено ${updatedCount} записів.`
      };
    });
  }

  async replaceTransaction(oldId, newTransactionData1, newTransactionData2) {
    return await transactionManager.execute(async (client) => {
      await this.repository.delete(oldId, client);
      await this.repository.save(newTransactionData1, client);
      await this.repository.save(newTransactionData2, client);

      return true;
    });
  }
}

export default FinanceService;
