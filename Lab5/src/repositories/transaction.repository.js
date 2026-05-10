class TransactionRepository {
  constructor(pool) {
    this.pool = pool;
  }

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
