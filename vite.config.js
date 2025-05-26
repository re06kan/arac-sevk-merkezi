export default {
  optimizeDeps: {
    exclude: [
      // Sık sorun çıkaran paketleri dışla
      'ng2-charts',
      'chart.js',
      'jspdf',
      'jspdf-autotable',
      'exceljs',
      'file-saver',
      // Spesifik hata veren chunk ID'lerini içeren paketler
      '@angular/material',
      '@angular/cdk',
      '@angular/forms'
    ]
  },
  build: {
    // Bazı modüllerin minimizasyonu sorun çıkarıyorsa
    commonjsOptions: {
      transformMixedEsModules: true 
    }
  }
}
