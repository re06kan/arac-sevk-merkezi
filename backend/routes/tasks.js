const express = require('express');
const router = express.Router();
const pool = require('../db');

// Görev oluşturma endpoint'ini güncelle
router.post('/', async (req, res) => {
  try {
    const {
      vehicle_id,
      driver_id,
      assigned_authority_id,
      ordered_by,
      start_km,
      task_paper_no,
      route_description,
      task_status = 0, // Varsayılan değer ekle (KAPALI için 0)
      return_message = null
    } = req.body;

    console.log('Gelen görev verisi:', req.body);  // Debug log ekle

    // Temel validasyon
    if (!vehicle_id || !driver_id) {
      return res.status(400).json({ 
        error: 'Eksik parametreler',
        message: 'Araç ID ve sürücü ID gereklidir'
      });
    }

    // task_status null kontrolü ekle
    if (task_status === null || task_status === undefined) {
      return res.status(400).json({
        error: 'Geçersiz görev durumu',
        message: 'task_status değeri null olamaz'
      });
    }

    // Sürücü ve araç kontrolü
    try {
      const driverCheck = await pool.query('SELECT id FROM drivers WHERE id = $1', [driver_id]);
      if (driverCheck.rows.length === 0) {
        return res.status(400).json({
          error: 'Geçersiz sürücü',
          message: `ID:${driver_id} ile eşleşen bir sürücü kaydı bulunamadı`
        });
      }

      const vehicleCheck = await pool.query('SELECT id FROM vehicles WHERE id = $1', [vehicle_id]);
      if (vehicleCheck.rows.length === 0) {
        return res.status(400).json({
          error: 'Geçersiz araç',
          message: `ID:${vehicle_id} ile eşleşen bir araç kaydı bulunamadı`
        });
      }
    } catch (checkError) {
      console.error('Kayıt validasyon hatası:', checkError);
      return res.status(500).json({
        error: 'Validasyon hatası',
        message: 'Sürücü ve araç bilgileri doğrulanamadı',
        details: checkError.message
      });
    }

    // task_type'ı belirle
    const task_type = task_status === 3 ? 'UZUN_YOL' : 'NORMAL';

    console.log('Oluşturulacak görev:', { 
      task_status, 
      task_type,
      vehicle_id,
      driver_id 
    });

    const result = await pool.query(
      `INSERT INTO task_registration (
        vehicle_id, driver_id, assigned_authority_id, ordered_by,
        start_km, task_paper_no, route_description, task_status, task_type,
        start_date, return_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, $10) 
      RETURNING *`,
      [vehicle_id, driver_id, assigned_authority_id, ordered_by,
       start_km, task_paper_no, route_description, task_status, task_type, return_message]
    );

    const statusMap = {
      0: 'KAPALI',
      1: 'ACIK',
      2: 'KADEMEDE',
      3: 'UZUN_YOL'
    };

    const response = {
      ...result.rows[0],
      task_status: statusMap[result.rows[0].task_status] || 'KAPALI'
    };

    console.log('Oluşturulan görev:', response); 
    res.status(201).json(response);

  } catch (error) {
    console.error('Görev oluşturma hatası:', error);
    
    // Foreign key hatası kontrolü
    if (error.code === '23503') { // PostgreSQL foreign key constraint violation kodu
      let constraintInfo = '';
      
      if (error.detail) {
        // Hangi foreign key'in ihlal edildiğini tespit et
        if (error.detail.includes('driver_id')) {
          constraintInfo = 'Geçersiz sürücü ID';
        } else if (error.detail.includes('vehicle_id')) {
          constraintInfo = 'Geçersiz araç ID';
        } else if (error.detail.includes('assigned_authority_id')) {
          constraintInfo = 'Geçersiz yetkili ID';
        } else {
          constraintInfo = 'Foreign key kısıtlama hatası';
        }
      }
      
      return res.status(400).json({ 
        error: 'Referans hatası', 
        message: constraintInfo,
        details: error.detail || error.message
      });
    }
    
    // NOT NULL constraint hatalarını kontrol et
    if (error.code === '23502') {
      const columnMatch = error.message.match(/column "([^"]+)"/);
      const column = columnMatch ? columnMatch[1] : 'bilinmeyen alan';
      
      return res.status(400).json({
        error: 'Zorunlu alan hatası',
        message: `${column} alanı boş olamaz`,
        details: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Görev oluşturulurken bir hata oluştu',
      details: error.message,
      stack: error.stack 
    });
  }
});

// Görevi başlatma endpointi güncellendi
router.put('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const { task_status = 1 } = req.body; // Varsayılan olarak ACIK (1)

    const result = await pool.query(
      `UPDATE task_registration 
       SET task_status = $1,
           start_date = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [task_status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Görev bulunamadı' });
    }

    // Task status'u string'e çevir
    const statusMap = {
      0: 'KAPALI',
      1: 'ACIK',
      2: 'KADEMEDE',
      3: 'UZUN_YOL'
    };

    res.json({
      ...result.rows[0],
      task_status: statusMap[result.rows[0].task_status],
      message: statusMap[result.rows[0].task_status] === 'UZUN_YOL' 
        ? 'Uzun yol görevi başarıyla başlatıldı'
        : 'Görev başarıyla başlatıldı'
    });

  } catch (error) {
    console.error('Görev başlatma hatası:', error);
    res.status(500).json({ error: 'Görev başlatılırken bir hata oluştu' });
  }
});

// Görevi sonlandırma endpoint'i güncellendi
router.put('/:id/end', async (req, res) => {
  try {
    const { id } = req.params;
    const { end_km, return_message } = req.body;

    // Önce mevcut görevi kontrol et
    const currentTask = await pool.query(
      'SELECT task_status FROM task_registration WHERE id = $1',
      [id]
    );

    if (currentTask.rows.length === 0) {
      return res.status(404).json({ error: 'Görev bulunamadı' });
    }

    // Görevi KAPALI (0) durumuna güncelle
    const result = await pool.query(
      `UPDATE task_registration 
       SET task_status = 0, 
           end_date = CURRENT_TIMESTAMP,
           end_km = $1,
           return_message = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND task_status IN (1, 2, 3) 
       RETURNING *`,
      [end_km, return_message, id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Görev zaten kapalı veya kapatılamıyor' });
    }

    // Yanıtı hazırla
    const response = {
      ...result.rows[0],
      task_status: 'KAPALI',
      message: 'Görev başarıyla kapatıldı'
    };

    res.json(response);
  } catch (error) {
    console.error('Görev sonlandırma hatası:', error);
    res.status(500).json({ error: 'Görev sonlandırılırken bir hata oluştu' });
  }
});

// Kademe işlemleri - kayıt işlemi ekle
router.post('/:taskId/maintenance/start', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { 
      arizaTuru, 
      arizaAciklama, 
      oncelik, 
      tahminiSure, 
      sorumluTeknisyen, 
      notlar 
    } = req.body;

    console.log('Kademe giriş isteği alındı:', {
      taskId,
      body: req.body
    });

    // Task ID tipini kontrol et ve dönüştür
    const numericTaskId = parseInt(taskId, 10);
    if (isNaN(numericTaskId)) {
      return res.status(400).json({ 
        error: 'Geçersiz task ID formatı',
        message: 'Task ID bir sayı olmalıdır.'
      });
    }

    // Teknisyen bilgisi kontrolü
    if (!sorumluTeknisyen) {
      return res.status(400).json({
        error: 'Eksik parametre',
        message: 'Sorumlu teknisyen bilgisi eksik'
      });
    }

    // 1. Görevi kontrol et
    const taskCheck = await pool.query(
      'SELECT * FROM task_registration WHERE id = $1',
      [numericTaskId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Görev bulunamadı',
        message: 'Belirtilen ID ile kayıtlı görev bulunamadı.'
      });
    }

    console.log('Görev bulundu:', taskCheck.rows[0]);

    // 2. Görev durumunu KADEMEDE olarak güncelle
    const taskUpdate = await pool.query(
      `UPDATE task_registration 
       SET task_status = 2 
       WHERE id = $1
       RETURNING *`,
      [numericTaskId]
    );

    console.log('Görev güncelleme sonucu:', taskUpdate.rows[0]);

    // 3. Bakım kaydını oluştur
    const maintenanceResult = await pool.query(
      `INSERT INTO maintenance_records (
        task_id, 
        fault_type, 
        fault_description, 
        priority, 
        estimated_hours, 
        technician, 
        notes,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE') 
      RETURNING *`,
      [
        numericTaskId, 
        arizaTuru, 
        arizaAciklama, 
        oncelik, 
        tahminiSure, 
        sorumluTeknisyen, 
        notlar
      ]
    );

    console.log('Bakım kaydı oluşturuldu:', maintenanceResult.rows[0]);

    // 4. Task kayıtına maintenance_id ekle
    const taskMaintenanceUpdate = await pool.query(
      `UPDATE task_registration SET maintenance_id = $1 WHERE id = $2 RETURNING *`,
      [maintenanceResult.rows[0].id, numericTaskId]
    );

    console.log('Task-maintenance ilişkisi güncellendi:', taskMaintenanceUpdate.rows[0]);

    // Başarılı yanıt gönder
    res.json({
      message: 'Kademe girişi başarıyla kaydedildi',
      task: taskUpdate.rows[0],
      maintenance: maintenanceResult.rows[0],
      success: true
    });
  } catch (error) {
    console.error('Kademe giriş isteği hatası:', error);
    res.status(500).json({ 
      error: 'İstek işlenirken hata oluştu',
      details: error.message,
      stack: error.stack
    });
  }
});

// Kademe çıkış endpoint'i
router.put('/:taskId/maintenance/:maintenanceId/end', async (req, res) => {
  try {
    const { taskId, maintenanceId } = req.params;
    const { 
      islemAciklama, 
      sonuc, 
      degisenParcalar, 
      notlar, 
      yeniKm 
    } = req.body;

    // 1. Bakım kaydını güncelle
    const maintenanceResult = await pool.query(
      `UPDATE maintenance_records 
       SET repair_description = $1,
           repair_result = $2,
           replaced_parts = $3,
           notes = CASE WHEN notes IS NULL OR notes = '' THEN $4 
                    ELSE notes || E'\n\n' || $4 END,
           end_date = CURRENT_TIMESTAMP,
           status = 'COMPLETED'
       WHERE id = $5 AND status = 'ACTIVE' 
       RETURNING *`,
      [islemAciklama, sonuc, JSON.stringify(degisenParcalar), notlar, maintenanceId]
    );

    if (maintenanceResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Bakım kaydı bulunamadı veya zaten tamamlanmış',
      });
    }

    // 2. Görev durumunu ACIK (1) yerine KAPALI (0) olarak güncelle
    const taskUpdate = await pool.query(
      `UPDATE task_registration 
       SET task_status = 0,
           end_date = CURRENT_TIMESTAMP,
           start_km = $1,
           end_km = $1  
       WHERE id = $2 AND task_status = 2 
       RETURNING *`,
      [yeniKm, taskId]
    );

    if (taskUpdate.rows.length === 0) {
      // Bakım kaydını geri al (rollback)
      await pool.query(
        `UPDATE maintenance_records SET status = 'ACTIVE', end_date = NULL 
         WHERE id = $1`, [maintenanceId]
      );
      
      return res.status(404).json({ 
        error: 'Görev bulunamadı veya güncellenemedi' 
      });
    }

    // Başarılı yanıt gönder
    res.json({
      message: 'Kademe çıkışı başarıyla kaydedildi',
      task: taskUpdate.rows[0],
      maintenance: maintenanceResult.rows[0]
    });
  } catch (error) {
    console.error('Kademe çıkış hatası:', error);
    res.status(500).json({ 
      error: 'İşlem gerçekleştirilirken hata oluştu',
      details: error.message 
    });
  }
});

// Bakım detaylarını getirme endpoint'i
router.get('/:taskId/maintenance/:maintenanceId', async (req, res) => {
  try {
    const { taskId, maintenanceId } = req.params;
    
    // Sorguyu güncelledik - Tüm araç bilgilerini almak için
    const result = await pool.query(
      `SELECT 
        m.*,
        v.military_plate, v.civilian_plate, v.brand, v.model,
        v.chassis_number, v.engine_number, v.type, v.assigned_authority
       FROM maintenance_records m
       JOIN task_registration tr ON m.task_id = tr.id
       JOIN vehicles v ON tr.vehicle_id = v.id
       WHERE m.id = $1 AND m.task_id = $2`,
      [maintenanceId, taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Bakım kaydı bulunamadı'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Bakım detayı alma hatası:', error);
    res.status(500).json({ 
      error: 'Bakım detayları alınırken hata oluştu',
      details: error.message 
    });
  }
});

// Uzun yol görevi başlatma
router.post('/:id/start-long-trip', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    // Görevi başlat ve durumu UZUN_YOL (3) olarak ayarla
    const result = await pool.query(
      `UPDATE task_registration 
       SET task_status = 3,
           start_date = CURRENT_TIMESTAMP
       WHERE id = $1 AND task_status = 0
       RETURNING *`,
      [taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Görev bulunamadı veya başlatılamıyor'
      });
    }

    res.json({
      ...result.rows[0],
      task_status: 'UZUN_YOL',
      message: 'Uzun yol görevi başlatıldı'
    });
  } catch (error) {
    console.error('Uzun yol görevi başlatma hatası:', error);
    res.status(500).json({ error: 'Uzun yol görevi başlatılırken bir hata oluştu' });
  }
});

// Araca ait tüm görevleri getirme
router.get('/vehicle/:vehicleId/all', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    
    const result = await pool.query(
      `SELECT 
        t.*,
        d.name as driver_name, d.rutbe as driver_rank,
        p.name as authority_name, p.rank as authority_rank,
        CASE 
          WHEN t.task_status = 0 THEN 'KAPALI'
          WHEN t.task_status = 1 AND t.task_type = 'NORMAL' THEN 'ACIK'
          WHEN t.task_status = 2 THEN 'KADEMEDE'
          WHEN t.task_status = 1 AND t.task_type = 'UZUN_YOL' THEN 'UZUN_YOL'
          WHEN t.task_status = 3 THEN 'UZUN_YOL'
        END as task_status_text
       FROM task_registration t
       LEFT JOIN drivers d ON t.driver_id = d.id
       LEFT JOIN personnel p ON t.assigned_authority_id = p.id
       WHERE t.vehicle_id = $1
       ORDER BY t.created_at DESC`,
      [vehicleId]
    );

    const tasks = result.rows.map(task => ({
      ...task,
      task_status: task.task_status_text
    }));

    res.json(tasks);
  } catch (error) {
    console.error('Görev listesi hatası:', error);
    res.status(500).json({ error: 'Görevler alınırken bir hata oluştu' });
  }
});

// Araçların güncel görev durumlarını getiren endpoint'i güncelle
router.get('/vehicle-statuses', async (req, res) => {
  try {
    const result = await pool.query(`
      WITH LastTaskPerVehicle AS (
        SELECT DISTINCT ON (tr.vehicle_id) 
          tr.vehicle_id,
          tr.id as task_id,
          tr.task_status,
          tr.task_type,
          tr.created_at
        FROM task_registration tr
        INNER JOIN vehicles v ON v.id = tr.vehicle_id
        WHERE v.visibility = 0  -- Sadece aktif araçların görevlerini al
        ORDER BY tr.vehicle_id, tr.id DESC  
      )
      SELECT 
        v.*,
        COALESCE(t.task_status, 0) as numeric_status,
        t.task_type,
        t.task_id,
        CASE 
          WHEN t.task_status IS NULL OR t.task_status = 0 THEN 'KAPALI'
          WHEN t.task_status = 1 AND t.task_type = 'NORMAL' THEN 'ACIK'
          WHEN t.task_status = 2 THEN 'KADEMEDE'
          WHEN t.task_type = 'UZUN_YOL' THEN 'UZUN_YOL'
          ELSE 'KAPALI'
        END as task_status
      FROM vehicles v
      LEFT JOIN LastTaskPerVehicle t ON v.id = t.vehicle_id
      WHERE v.visibility = 0  -- Sadece aktif araçları getir
      ORDER BY v.id
    `);

    console.log('Aktif araç durumları:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Araç durumları getirilirken hata:', error);
    res.status(500).json({ error: 'Araç durumları alınırken bir hata oluştu' });
  }
});

// Tüm görevleri getir
router.get('/all', async (req, res) => {
  try {
    const query = `
      SELECT 
        t.*,
        v.military_plate, 
        d.name as driver_name, 
        d.rutbe as driver_rank,
        p.name as authority_name, 
        p.rank as authority_rank
      FROM 
        tasks t
      LEFT JOIN 
        vehicles v ON t.vehicle_id = v.id
      LEFT JOIN 
        drivers d ON t.driver_id = d.id
      LEFT JOIN 
        personnel p ON t.assigned_authority_id = p.id
      ORDER BY 
        t.created_at DESC
    `;
    const [tasks] = await connection.query(query);
    res.json(tasks);
  } catch (error) {
    console.error('Görevler alınırken hata:', error);
    res.status(500).json({ error: 'Görevler alınırken bir hata oluştu' });
  }
});

// Tüm bakımları getir
router.get('/maintenances/all', async (req, res) => {
  try {
    const query = `
      SELECT 
        m.*,
        v.military_plate,
        t.start_date,
        t.end_date
      FROM 
        maintenances m
      LEFT JOIN 
        tasks t ON m.task_id = t.id
      LEFT JOIN 
        vehicles v ON t.vehicle_id = v.id
      ORDER BY 
        m.created_at DESC
    `;
    const [maintenances] = await connection.query(query);
    res.json(maintenances);
  } catch (error) {
    console.error('Bakım kayıtları alınırken hata:', error);
    res.status(500).json({ error: 'Bakım kayıtları alınırken bir hata oluştu' });
  }
});

// Görev istatistiklerini getir
router.get('/statistics', async (req, res) => {
  try {
    // Görev durumlarına göre sayım
    const statusQuery = `
      SELECT 
        task_status,
        COUNT(*) as count
      FROM 
        tasks
      GROUP BY 
        task_status
    `;
    
    // Aylık görev sayıları
    const monthlyQuery = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as task_count,
        SUM(IF(end_km IS NOT NULL AND start_km IS NOT NULL, end_km - start_km, 0)) as total_km
      FROM 
        tasks
      GROUP BY 
        DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY 
        month
      LIMIT 12
    `;
    
    const [statusStats] = await connection.query(statusQuery);
    const [monthlyStats] = await connection.query(monthlyQuery);
    
    res.json({
      status: statusStats,
      monthly: monthlyStats
    });
  } catch (error) {
    console.error('İstatistikler alınırken hata:', error);
    res.status(500).json({ error: 'İstatistikler alınırken bir hata oluştu' });
  }
});

// Benzersiz görev tiplerini getir
router.get('/types', async (req, res) => {
  try {
    const query = 'SELECT DISTINCT task_type FROM task_registration WHERE task_type IS NOT NULL';
    const result = await pool.query(query);
    
    // Sorgu sonucundan sadece task_type değerlerini içeren bir dizi oluştur
    const taskTypes = result.rows.map(row => row.task_type);
    
    res.json(taskTypes);
  } catch (error) {
    console.error('Görev tipleri getirilirken hata oluştu:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Rapor verisi getirme endpoint'i
router.post('/report', async (req, res) => {
  try {
    const { vehicleIds, vehicleTypes, driverIds, assignedAuthorityIds, taskTypes, startDate, endDate } = req.body;
    
    console.log('Rapor isteği alındı:', {
      vehicleIds, vehicleTypes, driverIds, assignedAuthorityIds, taskTypes, startDate, endDate // YENİ: assignedAuthorityIds eklendi
    });
    
    // SQL sorgusu için parametreleri hazırla
    const params = [];
    let paramIndex = 1;
    
    // Sorguyu oluştur
    let query = `
      SELECT 
        tr.*,
        v.military_plate,
        v.civilian_plate,
        v.brand,
        v.model,
        v.type as vehicle_type,
        d.name as driver_name,
        d.rutbe as driver_rank,
        d.visibility as driver_visibility, 
        p.name as authority_name, 
        p.rank as authority_rank,
        (tr.end_km - tr.start_km) as total_km,
        EXTRACT(EPOCH FROM (tr.end_date - tr.start_date))/3600 as duration_hours
      FROM 
        task_registration tr
      JOIN 
        vehicles v ON tr.vehicle_id = v.id
      LEFT JOIN
        drivers d ON tr.driver_id = d.id
      LEFT JOIN
        personnel p ON tr.assigned_authority_id = p.id
      WHERE 1=1
    `;
    
    // Araç ID'leri için filtre
    if (vehicleIds && vehicleIds.length > 0) {
      query += ` AND tr.vehicle_id = ANY($${paramIndex})`;
      params.push(vehicleIds);
      paramIndex++;
    }
    
    // Araç tipleri için filtre
    if (vehicleTypes && vehicleTypes.length > 0) {
      query += ` AND v.type = ANY($${paramIndex})`;
      params.push(vehicleTypes);
      paramIndex++;
    }
    
    // YENİ: Sürücü ID'leri için filtre
    if (driverIds && driverIds.length > 0) {
      query += ` AND tr.driver_id = ANY($${paramIndex})`;
      params.push(driverIds);
      paramIndex++;
    }
    
    // YENİ: Tahsisli makam ID'leri için filtre
    if (assignedAuthorityIds && assignedAuthorityIds.length > 0) {
      query += ` AND tr.assigned_authority_id = ANY($${paramIndex})`;
      params.push(assignedAuthorityIds);
      paramIndex++;
    }
    
    // Görev tipleri için filtre
    if (taskTypes && taskTypes.length > 0) {
      query += ` AND tr.task_type = ANY($${paramIndex})`;
      params.push(taskTypes);
      paramIndex++;
    }
    
    // Tarih aralığı için filtre
    if (startDate && endDate) {
      query += ` AND tr.start_date BETWEEN $${paramIndex} AND $${paramIndex+1}`;
      params.push(startDate, endDate);
      paramIndex += 2;
    } else if (startDate) {
      query += ` AND tr.start_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    } else if (endDate) {
      query += ` AND tr.start_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    // Sıralama
    query += ` ORDER BY tr.start_date DESC`;
    
    console.log('Çalıştırılacak sorgu:', query);
    console.log('Parametreler:', params);
    
    const result = await pool.query(query, params);
    
    console.log(`${result.rows.length} kayıt bulundu`);
    
    // Task status'u string'e çevir
    const response = result.rows.map(task => ({
      ...task,
      task_status: 
        task.task_status === 0 ? 'KAPALI' :
        task.task_status === 1 ? 'ACIK' :
        task.task_status === 2 ? 'KADEMEDE' : 'UZUN_YOL'
    }));
    
    res.json(response);
  } catch (error) {
    console.error('Rapor verisi getirme hatası:', error);
    res.status(500).json({ 
      error: 'Rapor verisi alınırken bir hata oluştu',
      details: error.message 
    });
  }
});

// Add endpoint for updating task end KM
router.put('/:id/end-km', async (req, res) => {
  try {
    const { id } = req.params;
    const { end_km, reason } = req.body;
    
    // Check if end_km is provided
    if (!end_km) {
      return res.status(400).json({ error: 'Geliş KM bilgisi zorunludur' });
    }
    
    // First get the task to check if it's valid
    const taskCheck = await pool.query(
      'SELECT * FROM task_registration WHERE id = $1', 
      [id]
    );
    
    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Görev bulunamadı' });
    }
    
    const task = taskCheck.rows[0];
    
    // Check if end_km is greater than start_km
    if (parseInt(end_km) <= parseInt(task.start_km)) {
      return res.status(400).json({ error: 'Geliş KM, çıkış KM\'den büyük olmalıdır' });
    }
    
    // Update the task
    const result = await pool.query(
      `UPDATE task_registration 
       SET end_km = $1, 
           modified_at = CURRENT_TIMESTAMP, 
           km_update_reason = $2
       WHERE id = $3 
       RETURNING *`,
      [end_km, reason, id]
    );
    
    // Log the update
    await pool.query(
      `INSERT INTO task_logs (task_id, action_type, action_details, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [id, 'KM_GUNCELLEME', JSON.stringify({
        old_end_km: task.end_km,
        new_end_km: end_km,
        reason: reason
      })]
    );
    
    res.json({
      success: true,
      message: 'Görev KM bilgisi güncellendi',
      task: result.rows[0]
    });
  } catch (error) {
    console.error('KM güncelleme hatası:', error);
    res.status(500).json({ 
      error: 'KM güncellenirken bir hata oluştu', 
      details: error.message 
    });
  }
});

// Diğer route'lar için exports
module.exports = router;
