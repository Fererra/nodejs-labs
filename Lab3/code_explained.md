# Lab3 — Повний розбір коду

## 1. `app.js` — Точка входу

```javascript
import express from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
```
- `express` — фреймворк для створення HTTP-сервера
- `dirname`, `join` — утиліти для роботи зі шляхами файлів
- `fileURLToPath` — перетворює `import.meta.url` (URL модуля) у звичайний шлях файлу

```javascript
import indexRouter from "./src/routes/index.js";
```
Імпорт роутера — він містить усі маршрути додатку.

```javascript
const app = express();
const PORT = 3000;
```
Створення Express-додатку та визначення порту.

```javascript
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```
В ESM (`"type": "module"`) немає глобальних `__filename`/`__dirname` (на відміну від CommonJS). Тому створюємо їх вручну:
- `import.meta.url` → `"file:///d:/KPI/.../app.js"`
- `fileURLToPath()` → `"d:\\KPI\\...\\app.js"`
- `dirname()` → `"d:\\KPI\\...\\Lab3"`

```javascript
app.set("view engine", "ejs");
app.set("views", join(__dirname, "views/pages"));
```
- Встановлюємо EJS як шаблонізатор
- Вказуємо папку, де шукати `.ejs` файли

```javascript
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```
Middleware для парсингу тіла запиту:
- `express.json()` — парсить `Content-Type: application/json`
- `express.urlencoded()` — парсить дані HTML-форм (`Content-Type: application/x-www-form-urlencoded`). `extended: true` дозволяє вкладені об'єкти.

```javascript
app.use(express.static(join(__dirname, "public")));
```
Роздача статичних файлів (CSS, JS, картинки) з папки `public/`.

```javascript
app.use("/", indexRouter);
```
Підключення роутера — всі маршрути починаються з `/`.

```javascript
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
```
Запуск HTTP-сервера на порті 3000.

---

## 2. `src/routes/index.js` — Маршрутизація

```javascript
import { Router } from "express";
```
`Router` — міні-додаток Express для групування маршрутів.

```javascript
const transaction = new TransactionRepository();
const service = new FinanceService(transaction);
const controller = new FinanceController(service);
```
**Dependency Injection** — створюємо об'єкти та передаємо залежності через конструктори:
- Repository не залежить ні від чого
- Service отримує repository
- Controller отримує service

```javascript
router.get("/", (req, res) => { res.render("index"); });
```
Головна сторінка — просто рендерить шаблон `index.ejs`.

```javascript
router.get("/add-record-page", (req, res) => {
  res.render("form", { record: null });
});
```
Сторінка додавання — рендерить форму з `record: null` (форма розуміє що це створення, а не редагування).

```javascript
router.post("/save", controller.createRecord);
router.get("/transactions", controller.getAllRecords);
router.get("/transaction/:id", controller.getRecordById);
router.get("/edit/:id", controller.getEditPage);
router.post("/edit/:id", controller.updateRecord);
router.post("/delete/:id", controller.deleteRecord);
```
- `GET` — отримання даних/сторінок
- `POST` — мутації (створення, оновлення, видалення)
- `:id` — параметр маршруту, доступний як `req.params.id`

---

## 3. `src/controllers/finance.controller.js` — Контролер

```javascript
class FinanceController {
  constructor(service) {
    this.service = service;
  }
```
Отримує сервіс через DI. Всі методи використовують `this.service`.

```javascript
  getAllRecords = async (req, res) => {
```
Arrow function (`= async () =>`) замість звичайного методу — **щоб зберегти контекст `this`** при передачі як callback в роутер (`controller.getAllRecords`). Без arrow function `this` був би `undefined`.

```javascript
    const filters = {
      type: req.query.type,
      category: req.query.category,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };
    const records = await this.service.getAllRecords(filters);
```
Збираємо фільтри з query-параметрів URL (`/transactions?type=income&category=Їжа`). `req.query` — об'єкт, який Express парсить з URL.

```javascript
    return res.render("transaction", {
      transactions: records,
      query: req.query,
    });
```
Рендеримо EJS-шаблон `transaction.ejs`, передаючи:
- `transactions` — масив записів для таблиці
- `query` — поточні фільтри для збереження стану форми

```javascript
  createRecord = async (req, res) => {
    const data = {
      amount: Number(req.body.amount),
      purchase: req.body.purchase,
      category: req.body.category,
      type: req.body.type,
    };
    await this.service.createRecord(data);
    return res.redirect("/transactions");
```
- `req.body` — дані з HTML-форми (парсяться middleware `express.urlencoded`)
- `Number(req.body.amount)` — форма відправляє рядки, конвертуємо в число
- `res.redirect("/transactions")` — після створення перенаправляємо на список (патерн PRG — Post/Redirect/Get)

```javascript
  getEditPage = async (req, res) => {
    const id = Number(req.params.id);
    const record = await this.service.getRecordById(id);
    if (!record) return res.status(404).send("Запис не знайдено");
    return res.render("form", { record });
```
Знаходимо запис по ID і передаємо у форму. Форма бачить `record !== null` → показує режим редагування.

```javascript
  deleteRecord = async (req, res) => {
    const id = Number(req.params.id);
    await this.service.deleteRecord(id);
    return res.redirect("/transactions");
```
Видаляємо і перенаправляємо назад.

---

## 4. `src/services/finance.service.js` — Сервіс

```javascript
class FinanceService {
  constructor(financeRepository) {
    this.repository = financeRepository;
  }
```
Отримує репозиторій через DI.

```javascript
  async getAllRecords(filters = {}) {
    let records = await this.repository.getAll();
```
Спочатку отримуємо ВСІ записи з файлу.

```javascript
    if (filters.type) {
      records = records.filter((record) => record.type === filters.type);
    }
```
Фільтр по типу — точне співпадіння (`income` або `expense`).

```javascript
    if (filters.category) {
      records = records.filter((record) =>
        record.category.toLowerCase().includes(filters.category.toLowerCase()),
      );
    }
```
Фільтр по категорії — часткове входження без урахування регістру. `"Розваги".toLowerCase().includes("розва")` → `true`.

```javascript
    if (filters.startDate) {
      records = records.filter((record) => record.date >= filters.startDate);
    }
    if (filters.endDate) {
      records = records.filter((record) => record.date <= filters.endDate);
    }
```
Фільтр по даті — порівняння рядків. Працює завдяки формату ISO `YYYY-MM-DD` (лексикографічний порядок = хронологічний).

**Ключова різниця з Lab4:** тут фільтрація в пам'яті (JavaScript `.filter()`), в Lab4 — на рівні SQL (`WHERE`).

---

## 5. `src/repositories/transaction.repository.js` — Репозиторій

```javascript
class TransactionRepository {
  #filePath;
  constructor() {
    this.#filePath = path.join(__dirname, "../data", "transactions.json");
  }
```
`#filePath` — **приватне поле** (ES2022). Доступне тільки всередині класу. Шлях до JSON-файлу.

### getById — через Callback

```javascript
  async getById(id) {
    const transactions = await new Promise((res, rej) => {
      extractFromFileCallback(this.#filePath, (err, data) => {
        res(data);
      });
    });
    return transactions.find((item) => item.id === id);
  }
```
`extractFromFileCallback` використовує callback-паттерн. Щоб використати з `await`, обгортаємо в `new Promise()`. Функція `res` (resolve) викликається коли дані готові.

### getAll — через Sync

```javascript
  async getAll() {
    return extractFromFileSync(this.#filePath);
  }
```
Синхронне читання. Метод `async`, але `extractFromFileSync` повертає дані синхронно.

### save — через Promise

```javascript
  async save(dto) {
    const { amount, category, type, purchase } = dto;
    const transactions = await extractFromFileWithPromise(this.#filePath);
```
Деструктуризація DTO (Data Transfer Object). Читання через Promise.

```javascript
    const maxId = transactions.reduce(
      (max, curr) => (curr.id > max ? curr.id : max), 0,
    );
    const newTransaction = { id: maxId + 1, ... };
```
Знаходимо максимальний ID та створюємо новий +1. `reduce` проходить по масиву, зберігаючи найбільший `id`.

```javascript
    transactions.push(newTransaction);
    const data = JSON.stringify(transactions, null, 2);
    await fs.writeFile(this.#filePath, data);
    return newTransaction;
```
Додаємо в масив → серіалізуємо в JSON (з відступом 2 пробіли) → перезаписуємо весь файл.

### update — через async/await

```javascript
  async update(id, dto) {
    const transactions = await extractFromFileAsync(this.#filePath);
    const updatedTransactions = transactions.map((item) => {
      if (item.id === id) return { ...item, ...dto };
      return item;
    });
    await fs.writeFile(this.#filePath, JSON.stringify(updatedTransactions, null, 2));
  }
```
`{ ...item, ...dto }` — spread-оператор: копіює всі поля з `item`, потім перезаписує полями з `dto`.

### delete — через async/await

```javascript
  async delete(id) {
    const transactions = await extractFromFileAsync(this.#filePath);
    const updatedTransactions = transactions.filter((item) => item.id !== id);
    await fs.writeFile(this.#filePath, JSON.stringify(updatedTransactions, null, 2));
  }
```
`.filter()` повертає новий масив без елемента з вказаним `id`.

---

## 6. Утиліти читання файлів (`repositories/utils/`)

### get-data-sync.js — Синхронне

```javascript
import fs from "fs";   // модуль fs БЕЗ промісів

const extractFromFileSync = (filePath) => {
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
};
```
`readFileSync` — **блокує Event Loop** поки файл не прочитається. Простий, але для сервера це погано — жоден інший запит не обробляється під час читання.

### get-data-callback.js — Callback

```javascript
import fs from "fs";

const extractFromFileCallback = (filePath, callback) => {
  fs.readFile(filePath, "utf-8", (error, data) => {
    if (error) {
      callback(error, []);
      return;
    }
    try {
      const parsedData = JSON.parse(data);
      callback(null, parsedData);
    } catch (parseError) {
      callback(parseError, []);
    }
  });
};
```
`fs.readFile` — **асинхронне** читання. Node.js ставить операцію в чергу I/O, Event Loop продовжує працювати. Коли файл прочитано, викликається callback.

Паттерн **error-first callback**: `callback(error, data)` — першим аргументом завжди помилка (`null` якщо все ок).

### get-data-promise.js — Promise

```javascript
import fs from "fs/promises";   // модуль fs З промісами

const extractFromFileWithPromise = (filePath) => {
  const transactions = fs
    .readFile(filePath, "utf-8")
    .then((data) => JSON.parse(data))
    .catch((err) => { return []; });
  return transactions;
};
```
`fs/promises` — версія `fs`, де всі функції повертають Promise. `.then()` обробляє успіх, `.catch()` — помилку.

### get-data-async.js — async/await

```javascript
import fs from "fs/promises";

const extractFromFileAsync = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};
```
Теж `fs/promises`, але синтаксис `await` «розгортає» Promise. Код виглядає синхронно, але **не блокує** Event Loop. Обробка помилок через `try/catch`.

---

## 7. `src/models/Transaction.js` — Модель

```javascript
class Transaction {
  constructor(id, type, amount, purchase, category, date) {
    this.id = id;           // number — унікальний ідентифікатор
    this.type = type;       // 'income' | 'expense'
    this.amount = amount;   // number — сума в грн
    this.purchase = purchase; // string — опис
    this.category = category; // string — категорія
    this.date = date;       // string — "YYYY-MM-DD"
  }
}
```
Описує структуру даних. JSON-об'єкти в `transactions.json` відповідають цій моделі.

---

## 8. `src/data/transactions.json` — Тестові дані (Task 5)

```json
[
  { "id": 3, "type": "expense", "amount": 300,
    "purchase": "Кава та круасан", "category": "Розваги", "date": "2026-03-17" },
  { "id": 4, "type": "expense", "amount": 800,
    "purchase": "Пальне для авто", "category": "Транспорт", "date": "2026-03-18" },
  { "id": 5, "type": "income", "amount": 20000,
    "purchase": "Основна зарплата", "category": "Зарплата", "date": "2026-04-01" },
  { "id": 6, "type": "expense", "amount": 2500,
    "purchase": "Оплата комунальних послуг", "category": "Комуналка", "date": "2026-04-05" },
  { "id": 7, "amount": 150,
    "category": "Їжа", "type": "expense", "purchase": "Піца з фори", "date": "2026-04-26" }
]
```
5 записів з різними типами, категоріями, датами та сумами для демонстрації фільтрів.

---

## 9. EJS-шаблони (views/)

### head.ejs
```html
<!DOCTYPE html>
<html lang="uk">
  <head>
    <meta charset="UTF-8" />
    <title>Домашня Бухгалтерія</title>
    <script src="https://cdn.tailwindcss.com"></script>  <!-- CSS-фреймворк -->
  </head>
  <body class="bg-gray-50 text-gray-900 min-h-screen flex flex-col">
```
Загальний `<head>` — підключає Tailwind CSS через CDN.

### header.ejs
Навігаційне меню з посиланнями: Головна, Транзакції, + Додати.

### footer.ejs
Закриває `<body>` та `</html>`, показує копірайт.

### index.ejs
Головна сторінка з привітанням і кнопкою «Переглянути транзакції».

### transaction.ejs
Основна сторінка:
- **Форма фільтрів** — select для типу, input для категорії, два date-picker для діапазону дат
- **Таблиця** — дата, категорія, сума (зелена для income, червона для expense), назва, тип, кнопки ✏️ та 🗑

```html
<%= (typeof query !== 'undefined' && query.type === 'income') ? 'selected' : '' %>
```
Зберігає обрані фільтри після відправки форми.

### form.ejs
Форма для створення та редагування:
```html
<%= record ? 'Редагувати транзакцію' : 'Додати транзакцію' %>
<form action="<%= record ? '/edit/' + record.id : '/save' %>" method="POST">
```
Одна форма для двох режимів: якщо `record !== null` → режим редагування (action = `/edit/:id`), інакше — створення (action = `/save`).
