import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { randomInt } from 'crypto';
import extractFromFileAsync from './utils/get-data-async.js';
import extractFromFileWithPromise from './utils/get-data-promise.js';
import extractFromFileCallback from './utils/get-data-callback.js';
import extractFromFileSync from './utils/get-data-sync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TransactionRepository {
    #filePath; 

    constructor() {
        this.#filePath = path.join(__dirname, '../data', 'transactions.json');
    }

    async getById(id) {
        const transactions = await new Promise((res, rej) => {
            extractFromFileCallback(this.#filePath, (err, data) => {
                res(data);
            });
        });

        return transactions.find(item => item.id === id);
    }

    async getAll() {
        return extractFromFileSync(this.#filePath);
    }

    async save(dto) {
        const { amount, category, type, purchase } = dto;

        const transactions = await extractFromFileWithPromise(this.#filePath);

        const maxId = transactions.reduce((max, curr) => curr.id > max ? curr.id : max, 0);

        const newTransaction = { 
            id: maxId + 1, 
            amount, 
            category, 
            type,
            purchase,
            date: new Date().toISOString().split("T")[0]
        };

        transactions.push(newTransaction);
        
        const data = JSON.stringify(transactions, null, 2);
        await fs.writeFile(this.#filePath, data);

        return newTransaction;
    }

    async update(id, dto) {
        const transactions = await extractFromFileAsync(this.#filePath);

        const updatedTransactions = transactions.map(item => {
            if (item.id === id) {
                return { ...item, ...dto }
            }

            return item;
        });

        const data = JSON.stringify(transactions, null, 2);
        await fs.writeFile(this.#filePath, data);       
    }

    async delete(id) {
        const transactions = await extractFromFileAsync(this.#filePath);

        const updatedTransactions = transactions.filter(item => item.id !== id);

        const data = JSON.stringify(updatedTransactions, null, 2);
        await fs.writeFile(this.#filePath, data);
    }
}

export default TransactionRepository;