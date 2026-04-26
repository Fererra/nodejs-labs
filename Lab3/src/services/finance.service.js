class FinanceService {
    constructor(financeRepository) {
        this.repository = financeRepository;
    }

    async getAllRecords(){
        return await this.repository.getAll();
    }
    async getRecordById(id){
        return await this.repository.getById(id);
    }
    async createRecord(data) {
        return await this.repository.save(data);//було create, але в репозиторії save, тому змінила на save
    }

    async updateRecord(id, data) {
        return await this.repository.update(id, data);
    }

    async deleteRecord(id) {
        return await this.repository.delete(id);
    }

    async getRecordsByPeriod(startDate, endDate) {
        const records = await this.repository.getAll();
        const start = new Date(startDate);
        const end = new Date(endDate);

        return records.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate >= start && recordDate <= end;
        });
    }

    async getGroupedRecords() {
        const records = await this.repository.getAll();

        return records.reduce((grouped, record) => {
            const category = record.category;

            if (!grouped[category]) {
                grouped[category] = {
                    totalIncome: 0,
                    totalExpense: 0,
                    transactions: []
                };
            }

            grouped[category].transactions.push(record);

            if (record.type === 'income') {
                grouped[category].totalIncome += record.amount;
            } else if (record.type === 'expense') {
                grouped[category].totalExpense += record.amount;
            }

            return grouped;
        }, {});
    }
}

export default FinanceService;