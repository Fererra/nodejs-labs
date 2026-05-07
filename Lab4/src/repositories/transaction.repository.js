class TransactionRepository {
  constructor(pool) {
    this.pool = pool

  }

  async getById(id) {
    try{
      const result = await this.pool.query("SELECT * FROM transactions WHERE id = $1", [id]);
      return result.rows[0];      
    }catch (error) {
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

  async filterByCategory(category) {
    try {
      const result = await this.pool.query("SELECT * FROM transactions WHERE category = $1", [category]);
      return result.rows;
    } catch (error) {
      console.error(`Error filtering transactions by category ${category}:`, error);
      throw error;
    }
  }


  async getByPeriod(startDate, endDate) {
    try {
      const result = await this.pool.query(
        "SELECT * FROM transactions WHERE date >= $1 AND date <= $2",
        [startDate, endDate]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error fetching transactions from ${startDate} to ${endDate}:`, error);
      throw error;
    }
  }

  async save(dto, client) {
    try {
      const db = client || this.pool
      const { amount, category, type, purchase } = dto;
      const date = new Date().toISOString().split("T")[0];
      
      const query = `
        INSERT INTO transactions (amount, category, type, purchase, date)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const values = [amount, category, type, purchase, date];
      
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error saving transaction:", error);
      throw error;
    }
  }

  async update(id, dto, client) {
    try {
      const db = client || this.pool
      const { amount, category, type, purchase, date } = dto;
      
      const query = `
        UPDATE transactions 
        SET amount = $1, category = $2, type = $3, purchase = $4, date = $5
        WHERE id = $6
        RETURNING *;
      `;
      const values = [amount, category, type, purchase, date, id];
      
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating transaction with id ${id}:`, error);
      throw error;
    }
  }

  async delete(id, client) {
    try {
      const db = client || this.pool
      const query = "DELETE FROM transactions WHERE id = $1 RETURNING *;";
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error deleting transaction with id ${id}:`, error);
      throw error;
    }
  }

  async updateCategoryTransactionally(oldCategory, newCategory, client) {
    try {
      const db = client || this.pool;
      const query = `
        UPDATE transactions 
        SET category = $2 
        WHERE category = $1 
        RETURNING id;
      `;
      const result = await db.query(query, [oldCategory, newCategory]);
      return result.rowCount;
    } catch (error) {
      console.error(`Error updating category from ${oldCategory} to ${newCategory}:`, error);
      throw error;
    }
  }
}

export default TransactionRepository;
