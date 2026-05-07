import pool from '../../config/database.js';

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

  async replaceTransaction(oldId, newTransactionData1, newTransactionData2) {
    const client = await pool.connect(); 
    
    try {
      await client.query('BEGIN'); 
      
      await this.repository.delete(oldId, client);
      await this.repository.save(newTransactionData1, client);
      await this.repository.save(newTransactionData2, client);

      await client.query('COMMIT');
      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Транзакцію відхилено. Зміни відкочено:", error.message);
      throw error;
      
    } finally {
      client.release();
    }
  }
}

export default FinanceService;
