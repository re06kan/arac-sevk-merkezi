const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'very_secret_key_change_in_production';

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Kullanıcıyı veritabanında ara
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND visibility = 0',
      [username]
    );

    // Kullanıcı bulunamadıysa
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre yanlış' });
    }

    const user = result.rows[0];
    
    // Şifre kontrolü
    const passwordValid = await bcrypt.compare(password, user.password);
    
    if (!passwordValid) {
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre yanlış' });
    }

    // Son giriş tarihini güncelle
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    // JWT oluştur
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role }, 
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Kullanıcı bilgilerini ve token'ı döndür
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Şifre değiştirme endpoint'i
router.post('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    
    // Kullanıcıyı veritabanında ara
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    // Kullanıcı bulunamadıysa
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'user_not_found' });
    }

    const user = result.rows[0];
    
    // Mevcut şifre kontrolü
    const passwordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!passwordValid) {
      return res.status(400).json({ message: 'current_password_incorrect' });
    }

    // Yeni şifreyi hashle
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Şifreyi güncelle
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedNewPassword, userId]
    );
    
    res.json({ success: true, message: 'password_updated' });
  } catch (error) {
    console.error('Şifre değiştirme hatası:', error);
    res.status(500).json({ message: 'server_error' });
  }
});

module.exports = router;
