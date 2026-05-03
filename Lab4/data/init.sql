CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    amount NUMERIC(10, 2) NOT NULL,
    purchase VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    type VARCHAR(10) CHECK (type IN ('income', 'expense')) NOT NULL,
    date DATE NOT NULL
);

INSERT INTO transactions (amount, purchase, category, type, date) VALUES
    (45000.00, 'Заробітна плата', 'Зарплата', 'income', '2026-03-01'),
    (1250.50, 'Сільпо: продукти на тиждень', 'Продукти', 'expense', '2026-03-02'),
    (12000.00, 'Оренда квартири за жовтень', 'Житло', 'expense', '2026-03-03'),
    (2500.00, 'Оплата комунальних послуг', 'Комуналка', 'expense', '2026-03-05'),
    (800.00, 'Квитки в кіно', 'Розваги', 'expense', '2026-03-08'),
    (8500.00, 'Фріланс: розробка лендінгу', 'Додатковий дохід', 'income', '2026-03-10'),
    (1500.00, 'Бензин', 'Транспорт', 'expense', '2026-03-12'),
    (350.00, 'Кава та десерти в центрі', 'Ресторани/Кафе', 'expense', '2026-03-15'),
    (4000.00, 'Нові кросівки', 'Одяг', 'expense', '2026-03-18'),
    (600.00, 'Абонемент у спортзал', 'Здоров''я та спорт', 'expense', '2026-03-20');