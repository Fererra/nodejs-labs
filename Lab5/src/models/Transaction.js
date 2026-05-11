import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

class Transaction extends Model {}

Transaction.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true 
  }
}, {
  sequelize,
  modelName: 'Transaction',
  tableName: 'transactions',
  timestamps: true
});

export default Transaction;