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

  async save(dto) {
    const { amount, category, type, purchase } = dto;
    const date = new Date().toISOString().split("T")[0];

    const rawRequest =
      "INSERT INTO transactions (amount, purchase, category, type, date) \
      VALUES ($1, $2, $3, $4, $5)";
    
    await pool.query(rawRequest, [amount, purchase, category, type, date]);
  }

  async update(id, dto) {
    const { amount, category, type, purchase } = dto;
    const transactions = await extractFromFileAsync(this.#filePath);

    const rawRequest =
      "UPDATE transactions SET amount = $1, purchase = $2, category = $3, type = $4 \
      WHERE id = $5";

    await pool.query(rawRequest, [amount, purchase, category, type, id]);
  }

  async delete(id) {
    const rawRequest =
    "DELETE from transactions WHERE id = $1";

    await pool.query(rawRequest, [id]);
  }
}

export default TransactionRepository;
