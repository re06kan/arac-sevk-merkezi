import { Component, Inject, HostListener, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button'; // Fixed import path
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-kademe-giris-modal',
  templateUrl: './kademe-giris-modal.component.html',
  styleUrls: ['./kademe-giris-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule, // Now correctly imported
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  host: {
    'style': 'display: block;',
    'role': 'dialog',
    'aria-modal': 'true',
    'class': 'kademe-giris-modal',
    'tabindex': '-1'
  }
})
export class KademeGirisModalComponent implements OnInit, OnDestroy {
  kademeForm: FormGroup;
  arizaTurleri = ['Mekanik', 'Elektrik', 'Lastik', 'Kaporta', 'Diğer'];
  oncelikler = ['Acil', 'Normal'];
  
  constructor(
    private dialogRef: MatDialogRef<KademeGirisModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private ngZone: NgZone,
    private router: Router
  ) {
    this.kademeForm = this.fb.group({
      arizaTuru: ['', Validators.required],
      arizaAciklama: ['', [Validators.required, Validators.maxLength(250)]],
      oncelik: ['Normal', Validators.required],
      tahminiSure: ['', Validators.required],
      sorumluTeknisyen: ['', [
        Validators.required, 
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern('^[a-zA-ZğüşıöçĞÜŞİÖÇ\\s]*$')
      ]],
      notlar: ['', Validators.maxLength(200)]
    });

    // Wheel event listener'ı passive olarak ekle
    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('wheel', this.onWheel, { passive: true });
    });

    // Dialog ayarlarını güncelle
    this.dialogRef.addPanelClass('kademe-giris-dialog');
    this.dialogRef.updatePosition({ top: '50px' });
    this.dialogRef.updateSize('1200px', 'auto');

    this.dialogRef.beforeClosed().subscribe(() => {
      window.removeEventListener('wheel', this.onWheel);
    });

    // ESC tuşu ve dışarı tıklama ile kapatmayı etkinleştir
    this.dialogRef.backdropClick().subscribe(() => {
      this.onCancel();
    });
    
    this.dialogRef.keydownEvents().subscribe(event => {
      if (event.key === 'Escape') {
        this.onCancel();
      }
    });
  }

  // Büyük harfe çevirme metodu eklendi
  toUpperCase(event: Event): void {
    const input = event.target as HTMLInputElement;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = input.value.toLocaleUpperCase('tr-TR');
    input.setSelectionRange(start, end);
  }
  
  // Sadece harf girişi için metod
  onlyLetters(event: KeyboardEvent): boolean {
    const pattern = /[a-zA-ZğüşıöçĞÜŞİÖÇ\s]/;
    const inputChar = String.fromCharCode(event.charCode);

    if (!pattern.test(inputChar)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  ngOnInit() {
    // Pasif wheel event listener ekleme - doğru şekilde yapılandırılmış
    document.addEventListener('wheel', this.handleWheel, { passive: true });
    
    // DEBUG: Verileri logla
    console.log('Vehicle:', this.data.vehicle);
    console.log('Current Task:', this.data.currentTask);
  }

  // Wheel event handler metodu
  private handleWheel = () => {
    // Boş fonksiyon - passive flag kullanıldığından içeriğe gerek yok
  };

  ngOnDestroy() {
    // Wheel event listener'ı kaldır - doğru referans ile
    document.removeEventListener('wheel', this.handleWheel);
  }

  private onWheel = (event: WheelEvent) => {
    // Boş metod - passive flag kullanıyoruz
  }

  onSubmit() {
    if (this.kademeForm.valid) {
      // Form verilerini al ve yanıt olarak gönder
      const formData = this.kademeForm.value;
      
      // Dialog'u kapat ve verileri geri dön
      this.dialogRef.close({
        ...formData,
        success: true,
        navigateToDashboard: true
      });
      
      // Ana sayfaya yönlendir
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 500);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
