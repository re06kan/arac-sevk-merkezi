const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/task', async (req, res) => {
  try {
    const { taskId, userId, actionType, vehicleId, actionDetails } = req.body;
    const ipAddress = req.ip;
    
    const result = await pool.query(
      `INSERT INTO task_logs 
       (task_id, user_id, action_type, vehicle_id, action_details, ip_address) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [taskId, userId, actionType, vehicleId, actionDetails, ipAddress]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Log creation error:', error);
    res.status(500).json({ error: 'Log kaydedilemedi' });
  }
});

router.get('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const result = await pool.query(
      `SELECT l.*, u.username, u.fullname 
       FROM task_logs l
       LEFT JOIN users u ON l.user_id = u.id
       WHERE l.task_id = $1 
       ORDER BY l.created_at DESC`,
      [taskId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Log fetch error:', error);
    res.status(500).json({ error: 'Loglar alınamadı' });
  }
});

// Tüm logları tarih aralığına ve işlem tipine göre filtreleyerek getiren endpoint
router.get('/', async (req, res) => {
  try {
    const { actionType, startDate, endDate } = req.query;
    
    console.log('Log filtreleri:', { actionType, startDate, endDate });
    
    let query = `
      SELECT l.*, u.username, u.fullname, 
             v.military_plate as vehicle_military_plate, 
             v.civilian_plate as vehicle_civilian_plate,
             COALESCE(v.military_plate, '') || ' / ' || COALESCE(v.civilian_plate, '') as vehicle_plate,
             l.ip_address
      FROM task_logs l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN vehicles v ON l.vehicle_id = v.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Filtreler
    if (actionType && actionType !== 'all') {
      params.push(actionType);
      query += ` AND l.action_type = $${params.length}`;
    }
    
    if (startDate) {
      params.push(startDate);
      query += ` AND l.created_at >= $${params.length}`;
    }
    
    if (endDate) {
      // Bitiş tarihine 1 gün ekleyelim ki o günün sonuna kadar olan kayıtları da içersin
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      params.push(endDateObj.toISOString());
      query += ` AND l.created_at < $${params.length}`;
    }
    
    query += ' ORDER BY l.created_at DESC';
    
    console.log('Oluşturulan SQL sorgusu:', query);
    console.log('Parametreler:', params);
    
    const result = await pool.query(query, params);
    console.log(`${result.rows.length} kayıt bulundu.`);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Log fetch error:', error);
    res.status(500).json({ error: 'Loglar alınamadı' });
  }
});

module.exports = router;
