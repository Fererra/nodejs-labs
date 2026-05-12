import sequelize from "../../config/database.js";

export const transactionManager = {
  /**
   * Виконує набір операцій всередині однієї Sequelize-транзакції.
   * @param {Function} callback - Функція, що містить логіку транзакції.
   *                              Отримує об'єкт транзакції Sequelize як аргумент.
   */
  async execute(callback) {
    const t = await sequelize.transaction();

    try {
      const result = await callback(t);

      await t.commit();

      return result;
    } catch (error) {
      await t.rollback();
      console.error("Transaction rolled back due to error:", error);
      throw error;
    }
  },
};
