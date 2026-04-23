import path from 'path';
import fs from 'fs/promises';
import extractFromFileAsync from './utils/get-data-async';
import extractFromFileWithPromise from './utils/get-data-promise';
import { randomInt } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FinanceRepository {
    #filePath; 

    constructor() {
        this.#filePath = path.join(__dirname, '../data', 'transactions.json');
    }

    async getById(id) {
        const transactions = await extractFromFileWithPromise(this.#filePath);
        return transactions.find(item => item.id === id);
    }

    async getAll() {
        return await extractFromFileWithPromise(this.#filePath);
    }

    async save(data) {
        const { amount, category, description } = data;

        const transactions = await extractFromFileAsync(this.#filePath);

        const newTransaction = { 
            id: randomInt(1000), 
            amount, 
            category, 
            description,
            date: new Date()
        };

        transactions.push(newTransaction);
        
        await fs.writeFile(this.#filePath, JSON.stringify(transactions));

        return newTransaction;
    }

    async update(id, data) {
        const { amount, description} = data;

        const transactions = await extractFromFileAsync(this.#filePath);

        const updatedTransactions = [].map(item => {
            if (item.id === id) {
                item.amount = amount;
                item.description = description;
            }

            return item;
        });

        await fs.writeFile(this.#filePath, JSON.stringify(updatedTransactions));       
    }

    async delete(id) {
        const transactions = await extractFromFileAsync(this.#filePath);

        const updatedTransactions = transactions.filter(item => item.id !== id);

        await fs.writeFile(this.#filePath, JSON.stringify(updatedTransactions));
    }
}

export default TransactionRepository;