-- Önce mevcut tabloları temizle (ihtiyaç duyulursa)
DROP TABLE IF EXISTS task_registration CASCADE;
DROP TABLE IF EXISTS maintenance_records CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS personnel CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS logs CASCADE;

-- Users tablosu
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    visibility INTEGER DEFAULT 0,
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Personnel tablosu
CREATE TABLE personnel (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    rank VARCHAR(50),
    visibility INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles tablosu
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    military_plate VARCHAR(20) NOT NULL,
    civilian_plate VARCHAR(20),
    chassis_number VARCHAR(50),
    engine_number VARCHAR(50),
    brand VARCHAR(100),
    model VARCHAR(100),
    type VARCHAR(50),
    assigned_authority VARCHAR(100),
    visibility INTEGER DEFAULT 0,
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drivers tablosu
CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    tc VARCHAR(11) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    rutbe VARCHAR(50),
    sicil_no VARCHAR(50),
    birthday DATE,
    birth_place VARCHAR(100),
    visibility INTEGER DEFAULT 0,
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task Registration tablosu
CREATE TABLE task_registration (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    driver_id INTEGER REFERENCES drivers(id),
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    start_km INTEGER,
    end_km INTEGER,
    task_type VARCHAR(50),
    route_description TEXT,
    assigned_authority INTEGER REFERENCES personnel(id),
    ordered_by VARCHAR(100),
    task_paper_no VARCHAR(50),
    return_message TEXT,
    task_status VARCHAR(20) DEFAULT 'ACIK',
    maintenance_id INTEGER,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance Records tablosu
CREATE TABLE maintenance_records (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES task_registration(id),
    fault_type VARCHAR(50) NOT NULL,
    fault_description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL,
    estimated_hours INTEGER NOT NULL,
    technician VARCHAR(100) NOT NULL,
    notes TEXT,
    repair_description TEXT,
    repair_result VARCHAR(50),
    replaced_parts TEXT,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Logs tablosu
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES task_registration(id),
    user_id INTEGER REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    vehicle_id INTEGER REFERENCES vehicles(id),
    action_details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin kullanıcısı oluştur (şifre: Rekan2025.04)
INSERT INTO users (username, password, fullname, role)
VALUES (
    '1111111111',
    '$2b$10$8KzQ9.QX5D3Q5h5X5X5X5OqH5H5H5H5H5H5H5H5H5H5H5H5H5H5H5', -- bcrypt ile hashlenmiş şifre
    'Sistem Yöneticisi',
    'admin'
);
