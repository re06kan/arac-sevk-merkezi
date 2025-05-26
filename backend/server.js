const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const path = require('path');

const app = express();

// En üstte route import
const taskRoutes = require('./routes/tasks');
const authRoutes = require('./routes/auth');
const logsRouter = require('./routes/logs');

app.use(cors());
app.use(bodyParser.json());

// API rotalarını önce tanımla
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/logs', logsRouter);

// Sürücü kaydetme
app.post('/api/drivers', async (req, res) => {
  try {
    const { tc, name, phone, rutbe, sicil_no, birthday, birth_place } = req.body;

    // Önce kontrol et
    const checkExisting = await pool.query(
      `SELECT
        CASE WHEN EXISTS(SELECT 1 FROM drivers WHERE tc = $1) THEN 'TC Kimlik No'
             WHEN EXISTS(SELECT 1 FROM drivers WHERE phone = $2) THEN 'Telefon numarası'
             WHEN EXISTS(SELECT 1 FROM drivers WHERE sicil_no = $3) THEN 'Sicil numarası'
        END as existing_field
      FROM drivers
      WHERE tc = $1 OR phone = $2 OR sicil_no = $3
      LIMIT 1`,
      [tc, phone, sicil_no]
    );

    if (checkExisting.rows[0]?.existing_field) {
      return res.status(400).json({
        error: 'Kayıt zaten mevcut',
        field: checkExisting.rows[0].existing_field
      });
    }

    // Tarihi ISO formatına dönüştür
    const formattedBirthday = birthday ? new Date(birthday).toISOString() : null;

    const result = await pool.query(
      `INSERT INTO drivers (tc, name, phone, rutbe, sicil_no, birthday, birth_place, create_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       RETURNING *`,
      [tc, name, phone, rutbe, sicil_no, formattedBirthday, birth_place]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    // Postgresql unique constraint error code
    if (error.code === '23505') {
      res.status(400).json({
        error: 'Bu bilgilere sahip bir kayıt zaten mevcut'
      });
    } else {
      res.status(500).json({
        error: 'Veritabanı hatası',
        details: error.message,
        stack: error.stack
      });
    }
  }
});

// Sürücüleri listeleme
app.get('/api/drivers', async (req, res) => {
  try {
    // Önce tablo var mı kontrol et
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'drivers'
      );
    `);

    if (!checkTable.rows[0].exists) {
      // Tablo yoksa oluştur
      await pool.query(`
        CREATE TABLE IF NOT EXISTS drivers (
          id SERIAL PRIMARY KEY,
          tc VARCHAR(11) NOT NULL,
          name VARCHAR(100) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          rutbe VARCHAR(50) NOT NULL,
          sicil_no VARCHAR(50) NOT NULL,
          birthday DATE,
          create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          visibility INTEGER DEFAULT 0
        );
      `);
    }

    const result = await pool.query('SELECT * FROM drivers ORDER BY create_date DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      error: 'Veritabanı hatası',
      details: error.message,
      stack: error.stack
    });
  }
});

// Görünürlük güncelleme endpoint'i
app.put('/api/drivers/:id/visibility', async (req, res) => {
  try {
    const { id } = req.params;
    const { visibility } = req.body;
    const result = await pool.query(
      'UPDATE drivers SET visibility = $1 WHERE id = $2 RETURNING *',
      [visibility, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      error: 'Veritabanı hatası',
      details: error.message
    });
  }
});

// Sürücü güncelleme endpoint'i
app.put('/api/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tc, name, phone, rutbe, sicil_no, birthday, birth_place } = req.body;

    // Phone numarasını temizle
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedBirthday = birthday ? new Date(birthday).toISOString() : null;

    console.log('Updating driver:', { id, tc, name, cleanPhone, rutbe, sicil_no, formattedBirthday });

    const result = await pool.query(
      `UPDATE drivers
       SET tc = $1, name = $2, phone = $3, rutbe = $4, sicil_no = $5, birthday = $6, birth_place = $7
       WHERE id = $8
       RETURNING *`,
      [tc, name, cleanPhone, rutbe, sicil_no, formattedBirthday, birth_place, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sürücü bulunamadı' });
    }

    console.log('Update successful:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      error: 'Veritabanı hatası',
      details: error.message
    });
  }
});

// Vehicles tablosu kontrolü ve endpoint'leri
app.get('/api/vehicles', async (req, res) => {
  try {
    // Önce tablo var mı kontrol et
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'vehicles'
      );
    `);

    if (!checkTable.rows[0].exists) {
      // Tablo yoksa oluştur
      await pool.query(`
        CREATE TABLE IF NOT EXISTS vehicles (
          id SERIAL PRIMARY KEY,
          military_plate VARCHAR(20) NOT NULL,
          civilian_plate VARCHAR(20) NOT NULL,
          chassis_number VARCHAR(50) NOT NULL,
          engine_number VARCHAR(50) NOT NULL,
          brand VARCHAR(100) NOT NULL,
          model VARCHAR(100) NOT NULL,
          type VARCHAR(50) NOT NULL,
          assigned_authority VARCHAR(100) NOT NULL,
          create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          visibility INTEGER DEFAULT 0
        );
      `);
    }

    const result = await pool.query('SELECT * FROM vehicles ORDER BY create_date DESC');
    console.log('Fetched vehicles:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Veritabanı hatası', details: error.message });
  }
});

app.post('/api/vehicles', async (req, res) => {
  try {
    const { militaryPlate, civilianPlate, chassisNumber, engineNumber, brand, model, type, assignedAuthority } = req.body;

    // Önce mevcut kayıtları kontrol et
    const checkExisting = await pool.query(
      `SELECT
        CASE WHEN EXISTS(SELECT 1 FROM vehicles WHERE military_plate = $1) THEN 'Askeri Plaka'
             WHEN EXISTS(SELECT 1 FROM vehicles WHERE civilian_plate = $2) THEN 'Sivil Plaka'
             WHEN EXISTS(SELECT 1 FROM vehicles WHERE chassis_number = $3) THEN 'Şasi Numarası'
             WHEN EXISTS(SELECT 1 FROM vehicles WHERE engine_number = $4) THEN 'Motor Numarası'
        END as existing_field
      FROM vehicles
      WHERE military_plate = $1 OR civilian_plate = $2 OR chassis_number = $3 OR engine_number = $4
      LIMIT 1`,
      [militaryPlate, civilianPlate, chassisNumber, engineNumber]
    );

    if (checkExisting.rows[0]?.existing_field) {
      return res.status(400).json({
        error: 'Kayıt zaten mevcut',
        field: checkExisting.rows[0].existing_field
      });
    }

    // Eğer kontroller geçildi ise kayıt işlemine devam et
    const result = await pool.query(
      `INSERT INTO vehicles (
        military_plate, civilian_plate, chassis_number, engine_number,
        brand, model, type, assigned_authority, create_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING *`,
      [militaryPlate, civilianPlate, chassisNumber, engineNumber, brand, model, type, assignedAuthority]
    );
    console.log('Created vehicle:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // PostgreSQL unique constraint violation error code
      res.status(400).json({
        error: 'Bu bilgilere sahip bir araç zaten kayıtlı'
      });
    } else {
      console.error('Create vehicle error:', error);
      res.status(500).json({ error: 'Veritabanı hatası', details: error.message });
    }
  }
});

// Tekil araç detayı getirme endpoint'i
app.get('/api/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Getting vehicle details for ID:', id);

    const result = await pool.query(`
      SELECT
        id,
        military_plate,
        civilian_plate,
        chassis_number,
        engine_number,
        brand,
        model,
        type,
        assigned_authority,
        visibility,
        create_date
      FROM vehicles
      WHERE id = $1 AND visibility = 0
    `, [id]);

    if (result.rows.length === 0) {
      console.log('No vehicle found with ID:', id);
      return res.status(404).json({
        error: 'Araç bulunamadı',
        message: 'Belirtilen ID ile aktif araç bulunamadı'
      });
    }

    console.log('Found vehicle:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({
      error: 'Veritabanı hatası',
      details: error.message
    });
  }
});

// Araç güncelleme endpoint'i
app.put('/api/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('UPDATE için alınan veriler:', { id, body: req.body });

    const { militaryPlate, civilianPlate, chassisNumber, engineNumber, brand, model, type, assignedAuthority } = req.body;

    const result = await pool.query(
      `UPDATE vehicles
       SET military_plate = $1,
           civilian_plate = $2,
           chassis_number = $3,
           engine_number = $4,
           brand = $5,
           model = $6,
           type = $7,
           assigned_authority = $8
       WHERE id = $9
       RETURNING *`,
      [militaryPlate, civilianPlate, chassisNumber, engineNumber, brand, model, type, assignedAuthority, id]
    );

    if (result.rows.length === 0) {
      console.log('Araç bulunamadı:', id);
      return res.status(404).json({ error: 'Araç bulunamadı' });
    }

    console.log('Güncelleme başarılı:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Araç güncelleme hatası:', error);
    res.status(500).json({
      error: 'Veritabanı hatası',
      details: error.message
    });
  }
});

// Araç görünürlük güncelleme endpoint'i
app.put('/api/vehicles/:id/visibility', async (req, res) => {
  try {
    const { id } = req.params;
    const { visibility } = req.body;

    console.log('Updating vehicle visibility:', { id, visibility });

    const result = await pool.query(
      'UPDATE vehicles SET visibility = $1 WHERE id = $2 RETURNING *',
      [visibility, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Araç bulunamadı' });
    }

    console.log('Visibility update successful:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Visibility update error:', error);
    res.status(500).json({ error: 'Veritabanı hatası', details: error.message });
  }
});

// Personnel endpoints
app.post('/api/personnel', async (req, res) => {
  try {
    const { name, rank } = req.body;

    const result = await pool.query(
      `INSERT INTO personnel (name, rank, create_date)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       RETURNING *`,
      [name, rank]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Personnel create error:', error);
    res.status(500).json({ error: 'Veritabanı hatası', details: error.message });
  }
});

app.get('/api/personnel', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM personnel ORDER BY create_date DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Personnel fetch error:', error);
    res.status(500).json({ error: 'Veritabanı hatası', details: error.message });
  }
});

// Personnel güncelleme endpoint'i
app.put('/api/personnel/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rank } = req.body;

    const result = await pool.query(
      `UPDATE personnel
       SET name = $1, rank = $2
       WHERE id = $3
       RETURNING *`,
      [name, rank, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Personel bulunamadı' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Personel güncelleme hatası:', error);
    res.status(500).json({
      error: 'Veritabanı hatası',
      details: error.message
    });
  }
});

// Personnel görünürlük güncelleme endpoint'i
app.put('/api/personnel/:id/visibility', async (req, res) => {
  try {
    const { id } = req.params;
    const { visibility } = req.body;

    const result = await pool.query(
      'UPDATE personnel SET visibility = $1 WHERE id = $2 RETURNING *',
      [visibility, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Personel bulunamadı' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Visibility update error:', error);
    res.status(500).json({ error: 'Veritabanı hatası', details: error.message });
  }
});

// Personnel mevcudiyet kontrolü endpoint'i
app.get('/api/personnel/check', async (req, res) => {
  try {
    const { name, rank } = req.query;

    const result = await pool.query(
      `SELECT
        CASE WHEN EXISTS(SELECT 1 FROM personnel WHERE name = $1) THEN 'İsim'
             WHEN EXISTS(SELECT 1 FROM personnel WHERE rank = $2) THEN 'Rütbe'
        END as field
      FROM personnel
      WHERE name = $1 OR rank = $2
      LIMIT 1`,
      [name, rank]
    );

    res.json({
      exists: !!result.rows[0]?.field,
      field: result.rows[0]?.field
    });
  } catch (error) {
    console.error('Check error:', error);
    res.status(500).json({ error: 'Kontrol sırasında hata oluştu' });
  }
});

// Kullanıcı kaydetme endpoint'i
app.post('/api/users', async (req, res) => {
  try {
    const { username, password, fullname, role } = req.body;

    // Şifreyi güvenli bir şekilde hashle (şifrele)
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Kullanıcıyı veritabanına kaydet
    const result = await pool.query(
      `INSERT INTO users (username, password, fullname, role, create_date)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING id, username, fullname, role, create_date`,
      [username, hashedPassword, fullname, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error);

    if (error.code === '23505') { // Unique constraint ihlali
      return res.status(400).json({ error: 'Bu kullanıcı adı zaten kayıtlı' });
    }

    res.status(500).json({
      error: 'Kullanıcı oluşturulamadı',
      details: error.message
    });
  }
});

// Kullanıcı listesini getirme endpoint'i
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, fullname, role, visibility, create_date, last_login
       FROM users
       ORDER BY create_date DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Kullanıcıları getirme hatası:', error);
    res.status(500).json({ error: 'Kullanıcı listesi alınamadı' });
  }
});

// Kullanıcı güncelleme endpoint'i
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, fullname, role } = req.body;

    // Log the received data for debugging (remove sensitive information from logs)
    console.log('User update request:', {
      id,
      username,
      fullname,
      role,
      hasPassword: !!password
    });

    // Validate data to prevent null/undefined issues
    if (!username || !fullname || !role) {
      return res.status(400).json({
        error: 'Kullanıcı adı, isim ve rol gereklidir'
      });
    }

    // Check if user exists first
    const userCheck = await pool.query(
      `SELECT id FROM users WHERE id = $1`,
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    let query;
    let params;

    if (password) {
      // Şifre değiştiriliyorsa, yeni şifreyi hashle
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      query = `
        UPDATE users
        SET username = $1, password = $2, fullname = $3, role = $4
        WHERE id = $5
        RETURNING id, username, fullname, role
      `;
      params = [username, hashedPassword, fullname, role, id];
    } else {
      // Şifre değiştirilmiyorsa, password alanını güncelleme
      query = `
        UPDATE users
        SET username = $1, fullname = $2, role = $3
        WHERE id = $4
        RETURNING id, username, fullname, role
      `;
      params = [username, fullname, role, id];
    }

    // Log the SQL query for debugging (remove in production)
    console.log('Update query:', query.replace(/\s+/g, ' ').trim());
    console.log('Update params:', params.map((p, i) => i === 1 && password ? '[REDACTED PASSWORD]' : p));

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      console.log('No rows affected when updating user ID:', id);
      return res.status(404).json({ error: 'Kullanıcı güncellenemedi' });
    }

    console.log('User updated successfully:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error);

    if (error.code === '23505') {
      return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
    }

    res.status(500).json({
      error: 'Kullanıcı güncellenemedi',
      details: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Kullanıcı görünürlüğünü değiştirme endpoint'i
app.put('/api/users/:id/visibility', async (req, res) => {
  try {
    const { id } = req.params;
    const { visibility } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET visibility = $1
       WHERE id = $2
       RETURNING id, username, fullname, role, visibility`,
      [visibility, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Görünürlük güncelleme hatası:', error);
    res.status(500).json({ error: 'Kullanıcı görünürlüğü güncellenemedi' });
  }
});

// Tabloları oluşturma fonksiyonu
const createTables = async () => {
  try {
    // Add this check to ensure the 'ghm' role is allowed in the users table
    await pool.query(`
      DO $$
      BEGIN
        -- Check if we need to alter the role column to include 'ghm' as a valid role
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'role'
        ) THEN
          -- Check if role column has a constraint
          IF EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid = 'users'::regclass AND conname LIKE '%role%'
          ) THEN
            -- Drop constraint if it exists
            EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I',
              (SELECT conname FROM pg_constraint
               WHERE conrelid = 'users'::regclass AND conname LIKE '%role%' LIMIT 1)
            );

            -- Recreate constraint with 'ghm'
            ALTER TABLE users ADD CONSTRAINT users_role_check
              CHECK (role IN ('admin', 'user', 'ghm'));
          END IF;
        END IF;
      END $$;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS personnel (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        rank VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        military_plate VARCHAR(20) NOT NULL,
        civilian_plate VARCHAR(20),
        brand VARCHAR(50),
        model VARCHAR(50),
        assigned_authority VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS maintenance_records (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL,
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

      -- task_registration tablosuna maintenance_id kolonu ekle
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'task_registration' AND column_name = 'maintenance_id'
        ) THEN
          ALTER TABLE task_registration ADD COLUMN maintenance_id INTEGER;
        END IF;
      END $$;

      -- task_registration tablosuna km_update_reason kolonu ekle
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'task_registration' AND column_name = 'km_update_reason'
        ) THEN
          ALTER TABLE task_registration ADD COLUMN km_update_reason TEXT;
          ALTER TABLE task_registration ADD COLUMN modified_at TIMESTAMP;
        END IF;
      END $$;
    `);
    console.log('Tablolar başarıyla oluşturuldu ve güncellendi');
  } catch (error) {
    console.error('Tablolar oluşturulurken hata:', error);
  }
};

// PostgreSQL bağlantı kontrolü ve tabloları oluştur
pool.connect((err, client, release) => {
  if (err) {
    console.error('Veritabanına bağlanırken hata:', err);
    return;
  }
  console.log('PostgreSQL veritabanına başarıyla bağlanıldı');
  release();

  // Tabloları oluştur
  createTables();
});

// Statik dosyaları servis et - API rotalarından SONRA
app.use(express.static(path.join(__dirname, 'public')));

// SPA için tüm diğer istekleri index.html'e yönlendir - EN SONDA olmalı
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
