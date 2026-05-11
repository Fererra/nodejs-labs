import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database.js'; // Імпорт від Студента 1

class OperationDate extends Model {}

OperationDate.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fullDate: {
    type: DataTypes.DATEONLY, // YYYY-MM-DD
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