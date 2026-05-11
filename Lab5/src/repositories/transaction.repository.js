import { Op } from "sequelize";
import { Transaction, Category, TransactionType, OperationDate } from "../models/index.js";
import Transaction from "../models/Transaction.js";
import Category from "../models/Category.js";
import OperationDate from "../models/OperationDate.js"

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
  
  async findOrCreateCategory(name, tx) {
    const [category] = await Category.findOrCreate({ where: { name }, transaction: tx });
    return category.id;
  }

  async findOrCreateDate(dateValue, tx) {
    const [date] = await OperationDate.findOrCreate({ where: { dateValue }, transaction: tx });
    return date.id;
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
