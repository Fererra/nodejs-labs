import { Op } from "sequelize";
import {
  Transaction,
  Category,
  TransactionType,
  OperationDate,
} from "../models/index.js";

class TransactionRepository {
  #mapToDTO = (record) => {
    if (!record) return null;
    return {
      id: record.id,
      amount: Number(record.amount),
      purchase: record.description,
      category: record.Category?.name || "Невідомо",
      type: record.TransactionType?.name || "Невідомо",
      date: record.OperationDate?.dateValue || "Невідомо",
    };
  };

  async findOrCreateCategory(name, tx) {
    const [category] = await Category.findOrCreate({
      where: { name },
      transaction: tx,
    });
    return category.id;
  }

  async findOrCreateDate(dateValue, tx) {
    const [date] = await OperationDate.findOrCreate({
      where: { dateValue },
      transaction: tx,
    });
    return date.id;
  }

  async getTypeIdByName(name) {
    const type = await TransactionType.findOne({ where: { name } });
    if (!type) throw new Error(`Type ${name} not found`);
    return type.id;
  }

  async getAllCategories() {
    const categories = await Category.findAll({ order: [["name", "ASC"]] });
    return categories.map((c) => c.toJSON());
  }

  async getAllTypes() {
    const types = await TransactionType.findAll();
    return types.map((t) => t.toJSON());
  }

  async getCategoryByName(name) {
    const category = await Category.findOne({ where: { name } });
    return category ? category.toJSON() : null;
  }

  async deleteCategoryById(id, tx) {
    return await Category.destroy({ where: { id }, transaction: tx });
  }

  async getAll(pagination = {}) {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await Transaction.findAndCountAll({
        include: [Category, TransactionType, OperationDate],
        order: [[OperationDate, "dateValue", "DESC"]],
        limit: limit,
        offset: offset,
        distinct: true,
      });

      return {
        records: rows.map(this.#mapToDTO),
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      };
    } catch (error) {
      console.error("Error fetching transactions via Sequelize:", error);
      throw error;
    }
  }

  async getById(id) {
    try {
      const record = await Transaction.findByPk(id, {
        include: [Category, TransactionType, OperationDate],
      });
      return this.#mapToDTO(record);
    } catch (error) {
      console.error(`Error fetching transaction ${id} via Sequelize:`, error);
      throw error;
    }
  }

  async getFiltered({
    type,
    category,
    startDate,
    endDate,
    page = 1,
    limit = 10,
  }) {
    try {
      const offset = (page - 1) * limit;

      const includeClause = [
        {
          model: TransactionType,
          where: type ? { name: type } : undefined,
        },
        {
          model: Category,
          where: category
            ? { name: { [Op.iLike]: `%${category}%` } }
            : undefined,
        },
        {
          model: OperationDate,
          where:
            startDate || endDate
              ? {
                  dateValue: {
                    ...(startDate && { [Op.gte]: startDate }),
                    ...(endDate && { [Op.lte]: endDate }),
                  },
                }
              : undefined,
        },
      ];

      const { count, rows } = await Transaction.findAndCountAll({
        include: includeClause,
        order: [[OperationDate, "dateValue", "DESC"]],
        limit: limit,
        offset: offset,
        distinct: true,
      });

      return {
        records: rows.map(this.#mapToDTO),
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      };
    } catch (error) {
      console.error("Error filtering transactions via Sequelize:", error);
      throw error;
    }
  }

  async save(dto, tx) {
    const { amount, categoryId, typeId, dateId, purchase } = dto;

    const newRecord = await Transaction.create(
      { amount, description: purchase, categoryId, typeId, dateId },
      { transaction: tx },
    );

    return newRecord;
  }

  async update(id, dto, tx) {
    const { amount, categoryId, typeId, purchase } = dto;

    const [updatedCount] = await Transaction.update(
      { amount, description: purchase, categoryId, typeId },
      { where: { id }, transaction: tx },
    );

    return updatedCount;
  }

  async updatePurchaseCategory(oldCatId, newCatId, tx) {
    const [updatedCount] = await Transaction.update(
      { categoryId: newCatId },
      { where: { categoryId: oldCatId }, transaction: tx },
    );

    return updatedCount;
  }

  async delete(id, tx) {
    const deletedCount = await Transaction.destroy({
      where: { id },
      transaction: tx,
    });

    return deletedCount;
  }
}

export default TransactionRepository;
