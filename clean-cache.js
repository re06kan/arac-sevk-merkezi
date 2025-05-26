const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const rimraf = require('rimraf');

// Proje kök dizini
const rootDir = __dirname;

// Temizlenecek klasörler
const pathsToClean = [
  '.angular/cache',
  'node_modules/.vite',
  'node_modules/.cache',
  '.vite'
];

console.log('Angular önbelleği temizleniyor...');

// rimraf yoksa yükleyelim
try {
  require.resolve('rimraf');
} catch (e) {
  console.log('rimraf paketi yükleniyor...');
  execSync('npm install rimraf --no-save', { stdio: 'inherit' });
}

let cleanedAny = false;

// Klasörleri temizle
pathsToClean.forEach(cachePath => {
  const absolutePath = path.join(rootDir, cachePath);
  
  if (fs.existsSync(absolutePath)) {
    try {
      rimraf.sync(absolutePath);
      console.log(`✓ ${cachePath} temizlendi`);
      cleanedAny = true;
    } catch (error) {
      console.error(`✗ ${cachePath} temizlenemedi: ${error.message}`);
    }
  } else {
    console.log(`- ${cachePath} zaten mevcut değil`);
  }
});

if (cleanedAny) {
  console.log('\n✅ Önbellek temizliği tamamlandı!');
  console.log('\nŞimdi aşağıdaki komutları sırayla çalıştırın:');
  console.log('1. npm install (veya gerekirse: npm ci)');
  console.log('2. npm start');
} else {
  console.log('\n⚠️ Temizlenecek önbellek klasörü bulunamadı.');
}

console.log('\nNot: Bu işlemden sonra projeniz temiz bir şekilde derlenecektir.');
