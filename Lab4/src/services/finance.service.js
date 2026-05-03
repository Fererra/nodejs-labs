class FinanceService {
  constructor(financeRepository) {
    this.repository = financeRepository;
  }

  
  async getAllRecords(filters = {}) {
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
}

export default FinanceService;
