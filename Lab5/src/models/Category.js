import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database.js';

class Category extends Model {}

Category.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  }
}, {
  sequelize,
  modelName: 'Category',
  tableName: 'categories',
  timestamps: false
});

export default Category;