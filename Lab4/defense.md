# Lab4 — Підготовка до захисту

## Загальна структура проєкту

```
Lab4/
├── app.js                                ← точка входу Express
├── config/database.js                    ← пул з'єднань PostgreSQL (Task 1)
├── compose.yaml                          ← Docker Compose для БД (Task 1)
├── data/init.sql                         ← DDL + seed-дані (Tasks 1, 6)
├── src/
│   ├── models/Transaction.js             ← клас-модель
│   ├── repositories/
│   │   └── transaction.repository.js     ← SQL-запити: CRUD + getFiltered (Tasks 2, 3)
│   ├── services/
│   │   └── finance.service.js            ← бізнес-логіка + транзакції (Tasks 4, 5)
│   ├── controllers/
│   │   └── finance.controller.js         ← обробка HTTP + помилки БД (Task 7 — наша частина)
│   └── routes/index.js                   ← маршрути + DI
└── views/
    ├── pages/
    │   ├── index.ejs                     ← головна
    │   ├── transaction.ejs               ← список транзакцій
    │   ├── form.ejs                      ← форма створення/редагування
    │   └── error.ejs                     ← сторінка помилок (Task 7 — наша частина)
    └── page-parts/
        ├── head.ejs, header.ejs, footer.ejs
```

### Архітектура — Controller → Service → Repository → PostgreSQL

```
Користувач → HTTP → Router → Controller → Service → Repository → PostgreSQL
                                  ↓
                             EJS-шаблон → HTML → Користувач
```

**Відмінність від Lab3:** замість файлу `transactions.json` — база PostgreSQL, замість `JSON.parse()` — SQL-запити через бібліотеку `pg`.

---

## Наша частина — Task №7: Адаптація контролерів

### 1. `_handleDbError(res, error)` — обробка помилок PostgreSQL

```javascript
_handleDbError(res, error) {
    switch (error.code) {
      case "23503":  // FK violation      → 409
      case "23505":  // unique violation  → 409
      case "23514":  // CHECK constraint  → 400
      case "23502":  // NOT NULL          → 400
      default:       //                   → 500
    }
}
```

PostgreSQL повертає стандартні SQLSTATE-коди в `error.code`. Ми маппимо їх на HTTP-статуси і рендеримо `error.ejs` замість голого тексту.

### 2. `_formatRecords(rows)` — форматування даних з БД

```javascript
_formatRecords(rows) {
    return rows.map(row => ({
      ...row,
      date: row.date instanceof Date ? row.date.toISOString().split("T")[0] : row.date,
      amount: Number(row.amount),
    }));
}
```

PostgreSQL повертає `date` як JS `Date`-об'єкт, `amount` (NUMERIC) як рядок. Контролер нормалізує перед передачею в EJS.

### 3. `error.ejs` — сторінка помилок

Відображає код помилки, повідомлення українською і кнопки навігації. Використовує ті ж partials (head, header, footer) що й решта сторінок.

### 4. `getFiltered()` у репозиторії — динамічний SQL

```javascript
async getFiltered({ type, category, startDate, endDate }) {
    let query = "SELECT * FROM transactions WHERE 1=1";
    const values = [];
    let i = 1;
    if (type)      { query += ` AND type = $${i++}`;          values.push(type); }
    if (category)  { query += ` AND category ILIKE $${i++}`;  values.push(`%${category}%`); }
    if (startDate) { query += ` AND date >= $${i++}`;          values.push(startDate); }
    if (endDate)   { query += ` AND date <= $${i++}`;          values.push(endDate); }
    // ...
}
```

- `WHERE 1=1` — щоб завжди можна дописувати `AND` без перевірки
- `$${i++}` — параметризований запит (захист від SQL-ін'єкцій)
- `ILIKE` — пошук без урахування регістру

### 5. Виправлення сервісу

`getAllRecords(filters)` раніше ігнорував фільтри — тепер делегує до `getFiltered()` коли є хоча б один фільтр.

### 6. Виправлення `updateRecord`

Форма не має поля дати, а репозиторій очікує `date` в DTO. Контролер тепер підтягує існуючий запис і зберігає його дату.

---

## Контрольні питання

### 1. Чим реляційні БД відрізняються від нереляційних?

| | Реляційні (SQL) | Нереляційні (NoSQL) |
|---|----------------|---------------------|
| Структура | Таблиці, жорстка схема | Документи, ключ-значення, графи |
| Зв'язки | FK, JOIN | Вкладені документи, денормалізація |
| Мова | SQL | Власні API |
| Транзакції | ACID | Обмежена підтримка |
| Масштабування | Вертикальне | Горизонтальне |
| Приклади | PostgreSQL, MySQL | MongoDB, Redis |

### 2. Що таке СУБД?

Програмне забезпечення для створення, зберігання, модифікації та вилучення даних. Забезпечує мову запитів (SQL), контроль доступу, цілісність, резервне копіювання, одночасний доступ. В нашому проєкті — PostgreSQL.

### 3. Для чого потрібна мова SQL?

Декларативна мова для роботи з реляційними БД:
- **DDL** — `CREATE TABLE`, `ALTER`, `DROP`
- **DML** — `SELECT`, `INSERT`, `UPDATE`, `DELETE`
- **DCL** — `GRANT`, `REVOKE`
- **TCL** — `BEGIN`, `COMMIT`, `ROLLBACK`

### 4. Розшифруйте ACID.

| | Властивість | Пояснення |
|---|------------|-----------|
| **A** | Atomicity | Все або нічого. Якщо одна операція падає — всі скасовуються |
| **C** | Consistency | БД завжди у валідному стані, обмеження не порушуються |
| **I** | Isolation | Паралельні транзакції не впливають одна на одну |
| **D** | Durability | Після COMMIT дані зберігаються навіть при збої |

**Приклад Atomicity з нашого коду:**
```javascript
await client.query('BEGIN');
await this.repository.delete(oldId, client);   // 1
await this.repository.save(newData1, client);   // 2
await this.repository.save(newData2, client);   // 3 — якщо падає → ROLLBACK 1 і 2
await client.query('COMMIT');
```

### 5. Що таке транзакції?

Група SQL-операцій, що виконуються як єдине ціле. `BEGIN` → операції → `COMMIT` (зберегти) або `ROLLBACK` (скасувати). Для транзакції потрібен окремий `client` (не `pool`), бо всі запити мають йти через одне з'єднання.

### 6. Рівні ізольованості транзакцій?

| Рівень | Dirty Read | Non-repeatable Read | Phantom Read |
|--------|-----------|-------------------|-------------|
| Read Uncommitted | ✅ | ✅ | ✅ |
| **Read Committed** (PG default) | ❌ | ✅ | ✅ |
| Repeatable Read | ❌ | ❌ | ✅ |
| Serializable | ❌ | ❌ | ❌ |

- **Dirty Read** — читання незакоміченних даних
- **Non-repeatable Read** — повторне читання дає інші дані
- **Phantom Read** — повторний запит повертає інший набір рядків

### 7. SQL-ін'єкції та захист?

Впровадження SQL через поля введення. Приклад: `'; DROP TABLE transactions; --`.

**Захист — параметризовані запити:**
```javascript
// ❌ pool.query(`SELECT * FROM t WHERE cat = '${input}'`);
// ✅ pool.query("SELECT * FROM t WHERE cat = $1", [input]);
```
Бібліотека `pg` сама екранує значення.

### 8. CRUD-операції в SQL?

| CRUD | SQL | Наш приклад |
|------|-----|-------------|
| Create | `INSERT` | `INSERT INTO transactions (...) VALUES ($1,...) RETURNING *` |
| Read | `SELECT` | `SELECT * FROM transactions WHERE id = $1` |
| Update | `UPDATE` | `UPDATE transactions SET ... WHERE id = $6 RETURNING *` |
| Delete | `DELETE` | `DELETE FROM transactions WHERE id = $1 RETURNING *` |

### 9. Для чого потрібні індекси?

Структура даних (B-tree), що прискорює пошук за стовпцем. Без індексу — Full Table Scan O(n), з індексом — O(log n). `PRIMARY KEY` створює індекс автоматично. Компроміс: прискорюють `SELECT`, уповільнюють `INSERT/UPDATE/DELETE`.

### 10. Primary Key vs Unique Key?

| | Primary Key | Unique Key |
|---|------------|------------|
| NULL | Не допускає | Допускає |
| Кількість | Один на таблицю | Декілька |
| Призначення | Ідентифікатор рядка | Унікальність значень |

В нашому проєкті: `id SERIAL PRIMARY KEY` — автоінкремент, NOT NULL, унікальний.
