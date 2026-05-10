class TransactionRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async getById(id) {
    try {
      const result = await this.pool.query(
        "SELECT * FROM transactions WHERE id = $1",
        [id],
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Error fetching transaction with id ${id}:`, error);
      throw error;
    }
  }

  async getAll() {
    try {
      const result = await this.pool.query("SELECT * FROM transactions");
      return result.rows;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  }

  async getFiltered({ type, category, startDate, endDate }) {
    try {
      let query = "SELECT * FROM transactions WHERE 1=1";
      const values = [];
      let i = 1;

      if (type) {
        query += ` AND type = $${i++}`;
        values.push(type);
      }
      if (category) {
        query += ` AND category ILIKE $${i++}`;
        values.push(`%${category}%`);
      }
      if (startDate) {
        query += ` AND date >= $${i++}`;
        values.push(startDate);
      }
      if (endDate) {
        query += ` AND date <= $${i++}`;
        values.push(endDate);
      }

      query += " ORDER BY date DESC";

      const result = await this.pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error("Error filtering transactions:", error);
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
