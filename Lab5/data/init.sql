CREATE TABLE IF NOT EXISTS transaction_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS operation_dates (
    id SERIAL PRIMARY KEY,
    date_value DATE UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    amount NUMERIC(10, 2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    type_id INTEGER NOT NULL REFERENCES transaction_types(id) ON DELETE RESTRICT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    date_id INTEGER NOT NULL REFERENCES operation_dates(id) ON DELETE RESTRICT
);


INSERT INTO transaction_types (name) VALUES 
    ('income'), 
    ('expense');

INSERT INTO categories (name) VALUES
    ('Зарплата'), 
    ('Продукти'), 
    ('Житло'), 
    ('Комуналка'), 
    ('Розваги'),
    ('Додатковий дохід'), 
    ('Транспорт'), 
    ('Ресторани/Кафе'), 
    ('Одяг'), 
    ('Здоров''я та спорт');

INSERT INTO operation_dates (date_value) VALUES
    ('2026-03-01'), ('2026-03-02'), ('2026-03-03'), ('2026-03-05'), ('2026-03-08'),
    ('2026-03-10'), ('2026-03-12'), ('2026-03-15'), ('2026-03-18'), ('2026-03-20');

INSERT INTO transactions (amount, description, type_id, category_id, date_id) VALUES
    (45000.00, 'Заробітна плата', 1, 1, 1),
    (1250.50, 'Сільпо: продукти на тиждень', 2, 2, 2),
    (12000.00, 'Оренда квартири за жовтень', 2, 3, 3),
    (2500.00, 'Оплата комунальних послуг', 2, 4, 4),
    (800.00, 'Квитки в кіно', 2, 5, 5),
    (8500.00, 'Фріланс: розробка лендінгу', 1, 6, 6),
    (1500.00, 'Бензин', 2, 7, 7),
    (350.00, 'Кава та десерти в центрі', 2, 8, 8),
    (4000.00, 'Нові кросівки', 2, 9, 9),
    (600.00, 'Абонемент у спортзал', 2, 10, 10);