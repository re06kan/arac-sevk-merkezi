-- Tabloyu temizle ve yeniden oluştur
DROP TABLE IF EXISTS personnel CASCADE;

CREATE TABLE personnel (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,           
    rank VARCHAR(25) NOT NULL,           
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    visibility INTEGER DEFAULT 0
);

-- Test verisi ekle
INSERT INTO personnel (name, rank) VALUES 
('1. JANDARMA KOMANDO TUGAY KOMUTANLIĞI', 'TUGAY KOMUTANI');
