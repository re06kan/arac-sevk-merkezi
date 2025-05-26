CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(11) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL, -- Şifrelenmiş şifre için daha uzun alan (bcrypt)
  fullname VARCHAR(30) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'user',
  visibility INTEGER DEFAULT 0, -- 0: görünür, 1: gizli
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  CONSTRAINT valid_role CHECK (role IN ('admin', 'user'))
);

-- İlk yönetici kullanıcısını oluştur (şifre: Admin123!@#)
INSERT INTO users (username, password, fullname, role) 
VALUES ('12345678901', '$2b$10$DvXzUyj1U5/zsZfKWK1Alu05mZT.AFszxHxz2bibU9ZtqHNgYHEGy', 'Sistem Yöneticisi', 'admin')
ON CONFLICT (username) DO NOTHING;
