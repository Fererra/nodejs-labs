import { Op } from "sequelize";
import { Transaction, Category, TransactionType, OperationDate } from "../models/index.js";

class TransactionRepository {
  constructor(pool) {
    this.pool = pool;
  }

  #mapToDTO = (record) => {
    if (!record) return null;
    return {
      id: record.id,
      amount: record.amount,
      purchase: record.description, // У БД description, фронт чекає purchase
      category: record.Category?.name || "Невідомо",
      type: record.TransactionType?.name || "Невідомо",
      date: record.OperationDate?.dateValue || "Невідомо",
    };
  };

  async findOrCreateCategory(name, client) {
    const db = client || this.pool;
    const findQuery = "SELECT id FROM categories WHERE name = $1";
    const res = await db.query(findQuery, [name]);

    if (res.rows.length > 0) return res.rows[0].id;

    const insertQuery =
      "INSERT INTO categories (name) VALUES ($1) RETURNING id";
    const newCat = await db.query(insertQuery, [name]);
    return newCat.rows[0].id;
  }

  async findOrCreateDate(dateValue, client) {
    const db = client || this.pool;
    const findQuery = "SELECT id FROM operation_dates WHERE date_value = $1";
    const res = await db.query(findQuery, [dateValue]);

    if (res.rows.length > 0) return res.rows[0].id;

    const insertQuery =
      "INSERT INTO operation_dates (date_value) VALUES ($1) RETURNING id";
    const newDate = await db.query(insertQuery, [dateValue]);
    return newDate.rows[0].id;
  }

  async getTypeIdByName(name) {
    const type = await TransactionType.findOne({ where: { name } });
    if (!type) throw new Error(`Type ${name} not found`);
    return type.id;
  }

  async getAllCategories() {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    return categories.map(c => c.toJSON());
  }

  async getAllTypes() {
    const types = await TransactionType.findAll();
    return types.map(t => t.toJSON());
  }

  async getCategoryByName(name) {
    const category = await Category.findOne({ where: { name } });
    return category ? category.toJSON() : null;
  }

  async getAll() {
    try {
      const records = await Transaction.findAll({
        include: [Category, TransactionType, OperationDate],
        order: [[OperationDate, 'dateValue', 'DESC']]
      });
      return records.map(this.#mapToDTO);
    } catch (error) {
      console.error("Error fetching transactions via Sequelize:", error);
      throw error;
    }
  }

  async getById(id) {
    try {
      const record = await Transaction.findByPk(id, {
        include: [Category, TransactionType, OperationDate]
      });
      return this.#mapToDTO(record);
    } catch (error) {
      console.error(`Error fetching transaction ${id} via Sequelize:`, error);
      throw error;
    }
  }

  async getFiltered({ type, category, startDate, endDate }) {
    try {
      const includeClause = [
        {
          model: TransactionType,
          where: type ? { name: type } : undefined
        },
        {
          model: Category,
          where: category ? { name: { [Op.iLike]: `%${category}%` } } : undefined
        },
        {
          model: OperationDate,
          where: (startDate || endDate) ? {
            dateValue: {
              ...(startDate && { [Op.gte]: startDate }),
              ...(endDate && { [Op.lte]: endDate })
            }
          } : undefined
        }
      ];

      const records = await Transaction.findAll({
        include: includeClause,
        order: [[OperationDate, 'dateValue', 'DESC']]
      });

      return records.map(this.#mapToDTO);
    } catch (error) {
      console.error("Error filtering transactions via Sequelize:", error);
      throw error;
    }
  }

  async save(dto, client) {
    const db = client || this.pool;
    const { amount, categoryId, typeId, dateId, purchase } = dto;

    const query = `
      INSERT INTO purchases (amount, category_id, type_id, date_id, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    
    const result = await db.query(query, [
      amount,
      categoryId,
      typeId,
      dateId,
      purchase,
    ]);

    return result.rows[0];
  }

  async update(id, dto, client) {
    const db = client || this.pool;
    const { amount, categoryId, type_id, purchase } = dto;

    const query = `
      UPDATE purchases 
      SET amount = $1, category_id = $2, type_id = $3, description = $4
      WHERE id = $5
      RETURNING *;
    `;

    const result = await db.query(query, [
      amount,
      categoryId,
      type_id,
      purchase,
      id,
    ]);

    return result.rows[0];
  }

  async updatePurchaseCategory(oldCatId, newCatId, client) {
    const db = client || this.pool;

    const query = "UPDATE purchases SET category_id = $1 WHERE category_id = $2";
    const result = await db.query(query, [newCatId, oldCatId]);

    return result.rowCount;
  }

  async delete(id, client) {
    const db = client || this.pool;

    const result = await db.query(
      "DELETE FROM purchases WHERE id = $1 RETURNING id", [id]
    );

    return result.rows[0];
  }
}

export default TransactionRepository;
