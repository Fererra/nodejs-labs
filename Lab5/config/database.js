import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
  },
);

try {
  await sequelize.authenticate();
  console.log("✅ Successfully connected to the database");
} catch (error) {
  console.error("❌ Error connecting to the database:", error.message);
}

export default sequelize;
