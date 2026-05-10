# Lab4 — Повний розбір коду

## Відмінність від Lab3

| | Lab3 | Lab4 |
|---|------|------|
| Сховище | JSON-файл | PostgreSQL |
| Читання | `fs.readFile` (4 способи) | `pool.query("SELECT ...")` |
| Запис | `fs.writeFile` (перезапис файлу) | `INSERT/UPDATE/DELETE` |
| Фільтрація | `.filter()` в пам'яті | `WHERE` в SQL |
| Транзакції | Немає | `BEGIN/COMMIT/ROLLBACK` |
| Залежності | `express`, `ejs` | + `pg` (PostgreSQL клієнт) |

---

## 1. `compose.yaml` — Docker Compose

```yaml
version: "3.8"
services:
  db:
    image: postgres:18-alpine
    container_name: home_accounting_db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: mysecretpassword
      POSTGRES_DB: accounting_db
    ports:
      - "5432:5432"
    volumes:
      - ./data/init.sql:/docker-entrypoint-initdb.d/init.sql
```

- `image: postgres:18-alpine` — легкий образ PostgreSQL 18
- `environment` — змінні середовища для створення БД та користувача при першому запуску
- `ports: "5432:5432"` — прокидання порту з контейнера на хост
- `volumes` — копіює `init.sql` в спеціальну папку контейнера, PostgreSQL автоматично виконає цей скрипт при створенні БД

---

## 2. `data/init.sql` — Схема та seed-дані

```sql
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    amount NUMERIC(10, 2) NOT NULL,
    purchase VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    type VARCHAR(10) CHECK (type IN ('income', 'expense')) NOT NULL,
    date DATE NOT NULL
);
```

- `SERIAL` — автоінкрементний integer (PostgreSQL сам генерує ID)
- `PRIMARY KEY` — унікальний ідентифікатор + NOT NULL + автоматичний індекс
- `NUMERIC(10, 2)` — число з 10 цифрами, 2 після коми (точна арифметика для грошей)
- `VARCHAR(255)` — рядок до 255 символів
- `CHECK (type IN ('income', 'expense'))` — обмеження: дозволені тільки ці два значення. При порушенні — помилка з кодом `23514`
- `NOT NULL` — поле обов'язкове. При порушенні — помилка `23502`

```sql
INSERT INTO transactions (amount, purchase, category, type, date) VALUES
    (45000.00, 'Заробітна плата', 'Зарплата', 'income', '2026-03-01'),
    ...
```
Seed-дані — 10 записів для демонстрації.

---

## 3. `config/database.js` — Пул з'єднань

```javascript
import pg from "pg";
const { Pool } = pg;
```
`pg` — нативна бібліотека для роботи з PostgreSQL (без ORM). `Pool` — пул з'єднань.

```javascript
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
```
Створюємо пул з параметрами з `.env` файлу. **Пул** — це набір відкритих з'єднань до БД, які переиспользовуються. Замість відкриття нового з'єднання на кожен запит (дорого), пул видає вільне з'єднання і повертає його назад після використання.

```javascript
pool.on("connect", () => {
  console.log("Підключено до бази даних PostgreSQL");
});
```
Подія при кожному новому з'єднанні в пулі.

```javascript
export default pool;
```
Експортуємо один екземпляр пулу — **singleton**. Всі модулі використовують той самий пул.

---

## 4. `app.js` — Точка входу

Ідентичний Lab3, єдина відмінність — `.env` файл:

```json
"start": "docker compose up -d --build && node --env-file=.env app.js"
```
- `docker compose up -d --build` — запускає PostgreSQL в контейнері (фоновий режим)
- `--env-file=.env` — Node.js 20+ вбудовано читає `.env` файл (замість пакету `dotenv`)

---

## 5. `src/routes/index.js` — Маршрутизація + DI

```javascript
const transaction = new TransactionRepository(pool);
const service = new FinanceService(transaction);
const controller = new FinanceController(service);
```
**Відмінність від Lab3:** репозиторій отримує `pool` — з'єднання з БД. В Lab3 конструктор був без аргументів (шлях до файлу був захардкоджений).

```javascript
router.post('/transactions/:id/replace', controller.replaceRecord);
```
Новий маршрут для Lab4 — заміна транзакції (демонстрація BEGIN/COMMIT/ROLLBACK).

---

## 6. `src/repositories/transaction.repository.js` — SQL-запити

```javascript
class TransactionRepository {
  constructor(pool) {
    this.pool = pool;
  }
```
Отримує пул з'єднань. Всі методи використовують `this.pool.query()`.

### getById — SELECT з параметром

```javascript
  async getById(id) {
    const result = await this.pool.query(
      "SELECT * FROM transactions WHERE id = $1", [id]
    );
    return result.rows[0];
  }
```
- `$1` — **параметризований запит** (захист від SQL-ін'єкцій). `pg` підставляє значення безпечно
- `[id]` — масив значень для підстановки
- `result.rows` — масив рядків результату
- `result.rows[0]` — перший (і єдиний) рядок, або `undefined`

### getAll — SELECT без фільтрів

```javascript
  async getAll() {
    const result = await this.pool.query("SELECT * FROM transactions");
    return result.rows;
  }
```

### getFiltered — динамічний WHERE (Task 7)

```javascript
  async getFiltered({ type, category, startDate, endDate }) {
    let query = "SELECT * FROM transactions WHERE 1=1";
    const values = [];
    let i = 1;
```
- `WHERE 1=1` — завжди true. Трюк, щоб далі просто дописувати `AND ...` без перевірки «чи це перша умова»
- `i` — лічильник параметрів (`$1`, `$2`, ...)

```javascript
    if (type) {
      query += ` AND type = $${i++}`;
      values.push(type);
    }
```
Якщо фільтр переданий — дописуємо умову і додаємо значення. `$${i++}` → `$1`, наступний буде `$2`.

```javascript
    if (category) {
      query += ` AND category ILIKE $${i++}`;
      values.push(`%${category}%`);
    }
```
`ILIKE` — пошук без урахування регістру (PostgreSQL-специфічне). `%...%` — часткове входження.

```javascript
    query += " ORDER BY date DESC";
    const result = await this.pool.query(query, values);
    return result.rows;
```
Сортування за датою (новіші спочатку). Фінальний запит може виглядати так:
```sql
SELECT * FROM transactions WHERE 1=1 AND type = $1 AND category ILIKE $2 ORDER BY date DESC
-- values: ['expense', '%Їжа%']
```

### save — INSERT з RETURNING

```javascript
  async save(dto, client) {
    const db = client || this.pool;
```
**Ключовий момент:** якщо передано `client` (з'єднання транзакції) — використовуємо його, інакше — звичайний `pool`. Це дозволяє використовувати `save` як окремо, так і в рамках транзакції.

```javascript
    const query = `
      INSERT INTO transactions (amount, category, type, purchase, date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await db.query(query, values);
    return result.rows[0];
```
- `RETURNING *` — PostgreSQL-фіча: повертає створений рядок (з автогенерованим `id`)
- Без цього довелось би робити додатковий `SELECT`

### update — UPDATE з RETURNING

```javascript
  async update(id, dto, client) {
    const db = client || this.pool;
    const { amount, category, type, purchase, date } = dto;
    const query = `
      UPDATE transactions
      SET amount = $1, category = $2, type = $3, purchase = $4, date = $5
      WHERE id = $6
      RETURNING *;
    `;
```
Оновлює всі поля запису з вказаним ID. Повертає оновлений рядок (або `undefined` якщо ID не знайдено).

### delete — DELETE з RETURNING

```javascript
  async delete(id, client) {
    const db = client || this.pool;
    const query = "DELETE FROM transactions WHERE id = $1 RETURNING *;";
    const result = await db.query(query, [id]);
    return result.rows[0];
```
Видаляє і повертає видалений рядок. Якщо ID не існує — `result.rows[0]` буде `undefined`.

---

## 7. `src/services/finance.service.js` — Бізнес-логіка

```javascript
import pool from '../../config/database.js';
```
Імпорт пулу для створення окремого з'єднання для транзакцій.

### getAllRecords — з фільтрами (Task 7)

```javascript
  async getAllRecords(filters = {}) {
    const hasFilters = filters.type || filters.category || filters.startDate || filters.endDate;
    if (hasFilters) {
      return await this.repository.getFiltered(filters);
    }
    return await this.repository.getAll();
  }
```
Якщо є фільтри — використовуємо `getFiltered` (динамічний SQL), інакше — `getAll`.

### replaceTransaction — транзакція БД (Task 5)

```javascript
  async replaceTransaction(oldId, newTransactionData1, newTransactionData2) {
    const client = await pool.connect();
```
`pool.connect()` — отримуємо **окреме з'єднання** з пулу. Для транзакції обов'язково використовувати один `client`, бо `BEGIN/COMMIT/ROLLBACK` діють в рамках одного з'єднання.

```javascript
    try {
      await client.query('BEGIN');
```
Починаємо транзакцію. Всі наступні запити через цей `client` — частина транзакції.

```javascript
      await this.repository.delete(oldId, client);
      await this.repository.save(newTransactionData1, client);
      await this.repository.save(newTransactionData2, client);
```
Три операції. Передаємо `client` у кожну — щоб вони використовували **те саме з'єднання** (і ту саму транзакцію).

```javascript
      await client.query('COMMIT');
      return true;
```
Все пройшло — фіксуємо зміни. Тільки після `COMMIT` дані реально записуються.

```javascript
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
```
Будь-яка помилка → **відкат всіх трьох операцій**. Навіть якщо delete і перший save вже «виконались» — ROLLBACK скасує їх. Це і є **атомарність** (ACID).

```javascript
    } finally {
      client.release();
    }
```
`finally` виконується **завжди** (і при успіху, і при помилці). `client.release()` повертає з'єднання в пул. Без цього — витік з'єднань, пул вичерпається.

---

## 8. `src/controllers/finance.controller.js` — Контролер (Task 7)

### _handleDbError — маппінг PG-помилок

```javascript
  _handleDbError(res, error) {
    console.error("Database error:", error.message);
    switch (error.code) {
      case "23503":
        return res.status(409).render("error", {
          statusCode: 409,
          message: "Неможливо виконати операцію: запис пов'язаний з іншими даними",
        });
```
`error.code` — SQLSTATE код від PostgreSQL. `23503` — порушення зовнішнього ключа (FK violation). HTTP `409 Conflict` — конфлікт з поточним станом ресурсу.

Аналогічно для `23505` (unique), `23514` (CHECK), `23502` (NOT NULL). Default → `500`.

### _formatRecords — нормалізація даних

```javascript
  _formatRecords(rows) {
    return rows.map((row) => ({
      ...row,
      date: row.date instanceof Date
        ? row.date.toISOString().split("T")[0]
        : row.date,
      amount: Number(row.amount),
    }));
  }
```
- `row.date` — PostgreSQL `DATE` → JS `Date` об'єкт → `"2026-03-01T00:00:00.000Z"` → `.split("T")[0]` → `"2026-03-01"`
- `row.amount` — PostgreSQL `NUMERIC` → JS string `"45000.00"` → `Number()` → `45000`

### getAllRecords

```javascript
  getAllRecords = async (req, res) => {
    const filters = {
      type: req.query.type || undefined,
      category: req.query.category || undefined,
      startDate: req.query.startDate || undefined,
      endDate: req.query.endDate || undefined,
    };
```
`|| undefined` — якщо query-параметр порожній рядок `""`, перетворюємо на `undefined` (щоб сервіс не вважав його фільтром).

```javascript
    const records = await this.service.getAllRecords(filters);
    return res.render("transaction", {
      transactions: this._formatRecords(records),
      query: req.query,
    });
```
Форматуємо дати/суми перед передачею в шаблон.

### updateRecord — збереження дати

```javascript
  updateRecord = async (req, res) => {
    // ...
    const existing = await this.service.getRecordById(id);
    if (!existing) {
      return res.status(404).render("error", { ... });
    }
    const data = {
      amount,
      purchase: req.body.purchase,
      category: req.body.category,
      type: req.body.type,
      date: existing.date instanceof Date
        ? existing.date.toISOString().split("T")[0]
        : existing.date,
    };
```
Форма (`form.ejs`) не має поля дати. Репозиторій `update()` очікує `date` в DTO. Тому спочатку підтягуємо існуючий запис і зберігаємо його дату.

### deleteRecord — перевірка існування

```javascript
    const deleted = await this.service.deleteRecord(id);
    if (!deleted) {
      return res.status(404).render("error", { statusCode: 404, message: "..." });
    }
```
`RETURNING *` повертає видалений рядок. Якщо ID не існує — `undefined` → 404.

### replaceRecord — обробка транзакційних помилок

```javascript
    } catch (error) {
      console.error("Transaction failed and rolled back:", error);
      if (error.code) {
        return this._handleDbError(res, error);
      }
      return res.status(500).json({
        message: "Помилка транзакції, зміни відкочено",
        error: error.message,
      });
    }
```
Якщо помилка має `.code` — це PG-помилка, обробляємо через `_handleDbError`. Якщо ні — загальна помилка (наприклад, мережева), повертаємо JSON.

---

## 9. EJS-шаблони

### error.ejs (Task 7 — нова сторінка)

```html
<h1 class="text-6xl ..."><%= statusCode ? statusCode : 500 %></h1>
<p><%= message ? message : 'Сталася помилка.' %></p>
<a href="/">На головну</a>
<a href="/transactions">До транзакцій</a>
```
Показує код помилки великим шрифтом, пояснення та кнопки навігації. Тернарні оператори `? :` — fallback якщо значення не передано.

### Решта шаблонів

Ідентичні Lab3 — `head.ejs`, `header.ejs`, `footer.ejs`, `index.ejs`, `transaction.ejs`, `form.ejs`. Вони працюють з тими ж змінними (`transactions`, `query`, `record`), тому не потребували змін при міграції з файлів на PostgreSQL.
