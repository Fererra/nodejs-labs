import { transactionManager } from '../db/transactionManager.js';

class FinanceService {
  constructor(financeRepository) {
    this.repository = financeRepository;
  }

  async getAllRecords(filters = {}) {
    let records = await this.repository.getAll();

    if (filters.type) {
      records = records.filter((record) => record.type === filters.type);
    }

    if (filters.category) {
      records = records.filter((record) =>
        record.category.toLowerCase().includes(filters.category.toLowerCase()),
      );
    }

    if (filters.startDate) {
      records = records.filter((record) => record.date >= filters.startDate);
    }

    if (filters.endDate) {
      records = records.filter((record) => record.date <= filters.endDate);
    }

    return records;
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
        message: `Транзакція успішна! Перенесено ${updatedCount} записів з '${oldCategory}' до '${newCategory}'.`
      };
    });
  }
}

export default FinanceService;
