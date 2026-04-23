import { pool } from '../db/index.js';

export const transactionRepository = {
  /**
   * Отримання транзакцій з динамічними фільтрами
   * @param {Object} filters - { categoryId, startDate, endDate }
   */
  async findAll(filters) {
    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];
    let paramCounter = 1;

    if (filters.categoryId) {
      query += ` AND category_id = $${paramCounter++}`;
      params.push(filters.categoryId);
    }

    if (filters.startDate) {
      query += ` AND created_at >= $${paramCounter++}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND created_at <= $${paramCounter++}`;
      params.push(filters.endDate);
    }

    const result = await pool.query(query, params);
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    return result.rows[0];
  }
};