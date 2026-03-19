import express from "express";
import { dirname, join } from "path";
import { fileURLToPath } from 'url';
import { teamData, findById } from "./src/data.js";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

app.use(express.static("public"));

app.get("/team", (req, res) => {
  res.render("team", { team: teamData });
});

app.get("/team/:id", (req, res) => {
  const id = req.params.id;
  const member = findById(id);

  if (!member) {
    return res.status(404).send(`Member with id "${id}" doesn't exist`)
  }

  return res.render("member", { member });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
