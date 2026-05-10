import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

await new Promise((resolve) => setTimeout(resolve, 1000));

pool
  .query("SELECT 1")
  .then(() => {
    console.log("✅ Successfully connected to the database");
  })
  .catch((error) => {
    console.error("❌ Error connecting to the database:", error.message);
  });

export default pool;
