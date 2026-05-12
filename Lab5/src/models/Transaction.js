import { Model, DataTypes } from "sequelize";
import sequelize from "../../config/database.js";

class Transaction extends Model {}

Transaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "category_id",
    },
    typeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "type_id",
    },
    dateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "date_id",
    },
  },
  {
    sequelize,
    modelName: "Transaction",
    tableName: "transactions",
    timestamps: false,
  },
);

export default Transaction;
