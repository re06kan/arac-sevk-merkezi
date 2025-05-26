@echo off
echo Arac Sevk Merkezi uygulamasi baslatiliyor...
echo.

:: Backend dizinine git
cd backend

:: Node.js sunucusunu yeni bir konsol penceresinde başlat
start cmd /k "echo Node.js sunucusu baslatiliyor... && node server.js"

:: 3 saniye bekle (sunucunun başlaması için)
timeout /t 3 /nobreak > nul

:: Tarayıcıyı aç
echo Tarayici aciliyor...
start http://localhost:3000

echo.
echo Uygulama baslatildi!
echo Kapatmak icin acilan konsol penceresinde Ctrl+C tuslarina basin
pause
