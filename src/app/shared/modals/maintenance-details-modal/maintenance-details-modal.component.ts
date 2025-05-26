import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-maintenance-details-modal',
  templateUrl: './maintenance-details-modal.component.html',
  styleUrls: ['./maintenance-details-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule
  ]
})
export class MaintenanceDetailsModalComponent {
  constructor(
    public dialogRef: MatDialogRef<MaintenanceDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    console.log('Bakım detayları:', data);
  }

  close(): void {
    this.dialogRef.close();
  }

  // Yazdırma fonksiyonu eklendi
  print(): void {
    // Yazdırma işlemi için DOM'un hazırlanması
    const printContents = document.querySelector('mat-dialog-content')?.innerHTML;
    const originalContents = document.body.innerHTML;
    
    if (printContents) {
      // Yazdırma sayfası oluştur
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(`
          <html>
            <head>
              <title>Kademe İşlem Detayları</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h2 { color: #ff9800; border-bottom: 2px solid #ff9800; padding-bottom: 10px; }
                h3 { color: #333; font-size: 1rem; border-left: 4px solid #ff9800; padding-left: 6px; }
                .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
                .info-item { padding: 5px 8px; background-color: #f5f5f5; border-radius: 4px; }
                .label { font-size: 0.75rem; color: #666; font-weight: 500; }
                .value { font-size: 0.9rem; color: #333; }
                .description-box { background-color: #f5f5f5; padding: 8px; border-radius: 4px; margin-top: 5px; }
                @media print {
                  body { margin: 0; padding: 10px; }
                }
              </style>
            </head>
            <body>
              <h2>Kademe İşlem Detayları</h2>
              ${printContents}
            </body>
          </html>
        `);
        printWindow.document.close();
        
        // Yazdırmadan önce stil yüklenmesini bekle
        setTimeout(() => {
          printWindow.print();
          // printWindow.close(); // Kullanıcı tarafından kapatılması için açık bırakıldı
        }, 500);
      }
    } else {
      // Fallback olarak mevcut sayfayı yazdır
      window.print();
    }
  }

  // Bakım süresi hesaplama
  calculateMaintenanceDuration(): string {
    if (!this.data.maintenance.end_date) {
      return 'Devam ediyor';
    }

    const start = new Date(this.data.maintenance.start_date);
    const end = new Date(this.data.maintenance.end_date);
    const diff = end.getTime() - start.getTime();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    let duration = '';
    if (days > 0) duration += `${days} gün `;
    if (hours > 0) duration += `${hours} saat `;
    if (minutes > 0) duration += `${minutes} dakika`;
    
    return duration.trim() || '1 dakikadan az';
  }
}
