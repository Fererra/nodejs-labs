import Transaction from "../models/Transaction.js";
import Category from "../models/Category.js";
import OperationDate from "../models/OperationDate.js"

class TransactionRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findOrCreateCategory(name, tx) {
    const [category] = await Category.findOrCreate({ where: { name }, transaction: tx });
    return category.id;
  }

  async findOrCreateDate(dateValue, tx) {
    const [date] = await OperationDate.findOrCreate({ where: { dateValue }, transaction: tx });
    return date.id;
  }

  async getTypeIdByName(name, client) {
    const db = client || this.pool;
    const res = await db.query(
      "SELECT id FROM transaction_types WHERE name = $1",
      [name],
    );
    if (res.rows.length === 0) throw new Error(`Type ${name} not found`);
    return res.rows[0].id;
  }

  async getAllCategories() {
    const res = await this.pool.query(
      "SELECT * FROM categories ORDER BY name ASC",
    );
    return res.rows;
  }

  async getAllTypes() {
    const res = await this.pool.query("SELECT * FROM transaction_types");
    return res.rows;
  }

  async getCategoryByName(name, client) {
    const db = client || this.pool;
    const res = await db.query("SELECT * FROM categories WHERE name = $1", [
      name,
    ]);
    return res.rows[0];
  }

  #getBaseSelect() {
    return `
      SELECT p.id, p.amount, p.description as purchase, 
             c.name as category, t.name as type, d.date_value as date
      FROM purchases p
      JOIN categories c ON p.category_id = c.id
      JOIN transaction_types t ON p.type_id = t.id
      JOIN operation_dates d ON p.date_id = d.id
    `;
  }

  async getAll() {
    try {
      const query = this.#getBaseSelect() + " ORDER BY d.date_value DESC";
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  }

  async getById(id) {
    try {
      const query = this.#getBaseSelect() + " WHERE p.id = $1";
      const result = await this.pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error fetching transaction ${id}:`, error);
      throw error;
    }
  }

  async getFiltered({ type, category, startDate, endDate }) {
    try {
      let query = this.#getBaseSelect() + " WHERE 1=1";
      const values = [];
      let i = 1;

      if (type) {
        query += ` AND t.name = $${i++}`;
        values.push(type);
      }
      if (category) {
        query += ` AND c.name ILIKE $${i++}`;
        values.push(`%${category}%`);
      }
      if (startDate) {
        query += ` AND d.date_value >= $${i++}`;
        values.push(startDate);
      }
      if (endDate) {
        query += ` AND d.date_value <= $${i++}`;
        values.push(endDate);
      }

      query += " ORDER BY d.date_value DESC";
      const result = await this.pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error("Error filtering transactions:", error);
      throw error;
    }
  }

  async save(dto, tx) {
    const { amount, categoryId, typeId, dateId, purchase } = dto;

    const purchase = await Purchase.create(
      { amount, purchase, categoryId, typeId, dateId},
      { transaction: tx}
    );

    return purchase;
  }

  async update(id, dto, tx) {
    const { amount, categoryId, type_id, purchase } = dto;

    const updated = await Transaction.update(
      { amount, purchase, categoryId, typeId },
      { where: { id }, transaction: tx }
    );

    return updated;
  }

  async updatePurchaseCategory(oldCatId, newCatId, tx) {
    const [amount] = await Transaction.update(
      { categoryId: newCatId },
      { where: { categoryId: oldCatId }, transaction: tx }
    );

    return amount;
  }

  async delete(id, tx) {
    const amount = await Transaction.destroy(
      { where: { id }, transaction: tx }
    );

    return amount;
  }
}

export default TransactionRepository;
