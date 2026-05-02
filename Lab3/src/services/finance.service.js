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
}

export default FinanceService;
