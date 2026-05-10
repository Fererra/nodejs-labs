import express from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import indexRouter from "./src/routes/index.js";
import sequelize from "./config/database.js";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.set("view engine", "ejs");
app.set("views", join(__dirname, "views/pages"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(join(__dirname, "public")));

app.use("/", indexRouter);

const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("✅ Database synchronized successfully");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error starting server:", error.message);
  }
};

startServer();
