import { pool } from '../config/database.js';

export const transactionManager = {
    /**
     * Виконує набір операцій всередині однієї SQL-транзакції.
     * @param {Function} callback - Функція, що містить логіку транзакції. 
     *                              Отримує client як аргумент.
     */
    async execute(callback) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            
            const result = await callback(client);
            
            await client.query('COMMIT');
            
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Transaction rolled back due to error:', error);
            throw error;
        } finally {
            client.release();
        }
    }
};