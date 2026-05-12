import sequelize from "../../config/database.js";

export const transactionManager = {
  async execute(callback) {
    return await sequelize.transaction(async (t) => {
      return await callback(t);
    });
  },
};
