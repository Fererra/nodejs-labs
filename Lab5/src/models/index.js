import Category from "./Category.js";
import TransactionType from "./TransactionType.js";
import OperationDate from "./OperationDate.js";
import Transaction from "./Transaction.js";

// 1. Одна Категорія має багато Транзакцій
Category.hasMany(Transaction, { foreignKey: "categoryId" });
Transaction.belongsTo(Category, { foreignKey: "categoryId" });

// 2. Один Тип має багато Транзакцій
TransactionType.hasMany(Transaction, { foreignKey: "typeId" });
Transaction.belongsTo(TransactionType, { foreignKey: "typeId" });

// 3. Одна Дата має багато Транзакцій
OperationDate.hasMany(Transaction, { foreignKey: "dateId" });
Transaction.belongsTo(OperationDate, { foreignKey: "dateId" });

export { Category, TransactionType, OperationDate, Transaction };
