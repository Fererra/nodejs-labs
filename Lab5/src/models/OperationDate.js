import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

class OperationDate extends Model {}

OperationDate.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fullDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    unique: true
  }
}, {
  sequelize,
  modelName: 'OperationDate',
  tableName: 'operation_dates',
  timestamps: false 
});

export default OperationDate;