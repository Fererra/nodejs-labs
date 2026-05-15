import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

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

  getAllTypes() {
    try {
      const db = extractFromFileSync(this.#filePath);
      return db.transactionTypes || [];
    } catch (error) {
      console.error("Помилка синхронного читання:", error);
      return [];
    }
  }

  async getAllCategories() {
    return new Promise((resolve, reject) => {
      extractFromFileCallback(this.#filePath, (err, db) => {
        if (err) {
          console.error("Помилка читання через callback:", err);
          return reject(err);
        }
        resolve(db.categories || []);
      });
    });
  }

  async getAll() {
    const db = await extractFromFileAsync(this.#filePath);

    if (!db.purchases) return [];

    return db.purchases.map((purchase) => {
      const category = db.categories.find((c) => c.id === purchase.categoryId);
      const type = db.transactionTypes.find((t) => t.id === purchase.typeId);
      const date = db.operationDates.find((d) => d.id === purchase.dateId);

      return {
        id: purchase.id,
        amount: purchase.amount,
        purchase: purchase.description,
        category: category ? category.name : "Невідомо",
        type: type ? type.name : "Невідомо",
        date: date ? date.dateValue : "Невідомо",
      };
    });
  }

  async getById(id) {
    const allPurchases = await this.getAll();
    return allPurchases.find((item) => item.id === id);
  }

  async save(dto) {
    const db = await extractFromFileWithPromise(this.#filePath);

    let category = db.categories.find((c) => c.name === dto.category);
    if (!category) {
      const maxCatId = db.categories.reduce(
        (max, c) => (c.id > max ? c.id : max),
        0,
      );

      category = { id: maxCatId + 1, name: dto.category };
      db.categories.push(category);
    }

    const currentDate = new Date().toISOString().split("T")[0];
    let operationDate = db.operationDates.find(
      (d) => d.dateValue === currentDate,
    );
    if (!operationDate) {
      const maxDateId = db.operationDates.reduce(
        (max, d) => (d.id > max ? d.id : max),
        0,
      );

      operationDate = { id: maxDateId + 1, dateValue: currentDate };
      db.operationDates.push(operationDate);
    }

    let type = db.transactionTypes.find((t) => t.name === dto.type);
    if (!type) {
      throw new Error(`Тип транзакції '${dto.type}' не знайдено в базі.`);
    }

    const maxPurchaseId = db.purchases.reduce(
      (max, p) => (p.id > max ? p.id : max),
      0,
    );
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

  async update(id, dto) {
    const db = await extractFromFileAsync(this.#filePath);

    const purchaseIndex = db.purchases.findIndex((p) => p.id === id);
    if (purchaseIndex === -1) return null;

    let category = db.categories.find((c) => c.name === dto.category);
    if (!category) {
      const maxCatId = db.categories.reduce(
        (max, c) => (c.id > max ? c.id : max),
        0,
      );

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

  async delete(id) {
    const db = await extractFromFileAsync(this.#filePath);

    const initialLength = db.purchases.length;
    db.purchases = db.purchases.filter((p) => p.id !== id);

    if (db.purchases.length !== initialLength) {
      await fs.writeFile(this.#filePath, JSON.stringify(db, null, 2));
    }
  }
}

export default TransactionRepository;
