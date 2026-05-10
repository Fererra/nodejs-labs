import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { randomInt } from "crypto";
import extractFromFileAsync from "./utils/get-data-async.js";
import extractFromFileWithPromise from "./utils/get-data-promise.js";
import extractFromFileCallback from "./utils/get-data-callback.js";
import extractFromFileSync from "./utils/get-data-sync.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TransactionRepository {
  #filePath;

  constructor() {
    this.#filePath = path.join(__dirname, "../data", "transactions.json");
  }

  async getById(id) {
    const transactions = await new Promise((res, rej) => {
      extractFromFileCallback(this.#filePath, (err, data) => {
        res(data);
      });
    });

    return transactions.find((item) => item.id === id);
  }

  async getAll() {
    return extractFromFileSync(this.#filePath);
  }

  async savePurchase(dto) {
    const db = await extractFromFileWithPromise(this.#filePath);

    let category = db.categories.find(c => c.name === dto.category);
    if (!category) {
      const maxCatId = db.categories.reduce((max, c) => (c.id > max ? c.id : max), 0);

      category = { id: maxCatId + 1, name: dto.category };
      db.categories.push(category);
    }

    const currentDate = new Date().toISOString().split("T")[0];
    let operationDate = db.operationDates.find(d => d.dateValue === currentDate);
    if (!operationDate) {
      const maxDateId = db.operationDates.reduce((max, d) => (d.id > max ? d.id : max), 0);

      operationDate = { id: maxDateId + 1, dateValue: currentDate };
      db.operationDates.push(operationDate);
    }

    let type = db.transactionTypes.find((t) => t.name === dto.type);
    if (!type) {
      throw new Error(`Тип транзакції '${dto.type}' не знайдено в базі.`);
    }

    const maxPurchaseId = db.purchases.reduce((max, p) => (p.id > max ? p.id : max), 0);
    const newPurchase = {
      id: maxPurchaseId + 1,
      amount: dto.amount,
      description: dto.purchase,
      categoryId: category.id,
      typeId: type.id,
      dateId: operationDate.id,
    };

    db.purchases.push(newPurchase);

    await fs.writeFile(this.#filePath, JSON.stringify(db, null, 2));

    return newPurchase;
  }

  async updatePurchase(id, dto) {
    const db = await extractFromFileAsync(this.#filePath);

    const purchaseIndex = db.purchases.findIndex((p) => p.id === id);
    if (purchaseIndex === -1) return null;

    let category = db.categories.find((c) => c.name === dto.category);
    if (!category) {
      const maxCatId = db.categories.reduce((max, c) => (c.id > max ? c.id : max), 0);
      
      category = { id: maxCatId + 1, name: dto.category };
      db.categories.push(category);
    }

    let type = db.transactionTypes.find((t) => t.name === dto.type);

    db.purchases[purchaseIndex] = {
      ...db.purchases[purchaseIndex],
      amount: dto.amount,
      description: dto.purchase,
      categoryId: category.id,
      typeId: type ? type.id : db.purchases[purchaseIndex].typeId,
    };

    await fs.writeFile(this.#filePath, JSON.stringify(db, null, 2));
    return db.purchases[purchaseIndex];
  }

  async deletePurchase(id) {
    const db = await extractFromFileAsync(this.#filePath);

    const initialLength = db.purchases.length;
    db.purchases = db.purchases.filter((p) => p.id !== id);

    if (db.purchases.length !== initialLength) {
      await fs.writeFile(this.#filePath, JSON.stringify(db, null, 2));
    }
  }
}


export default TransactionRepository;
