import { DataTypes, Model } from "sequelize";
import sequelize from "../../config/database.js";

class TransactionType extends Model {}

TransactionType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isIn: [["income", "expense"]],
      },
    },
  },
  {
    sequelize,
    modelName: "TransactionType",
    tableName: "transaction_types",
    timestamps: false,
  },
);

export default TransactionType;
