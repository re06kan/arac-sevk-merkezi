import { Component, Inject, NgZone, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';

@Component({
  selector: 'app-kademe-cikis-modal',
  templateUrl: './kademe-cikis-modal.component.html',
  styleUrls: ['./kademe-cikis-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatDividerModule
  ]
})
export class KademeCikisModalComponent implements OnInit, OnDestroy {
  kademeCikisForm: FormGroup;
  sonuclar = ['Onarıldı', 'Kısmen Onarıldı', 'Onarılamadı'];
  currentKm: number = 0;
  
  constructor(
    private dialogRef: MatDialogRef<KademeCikisModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private ngZone: NgZone
  ) {
    // Mevcut KM değerini al
    this.currentKm = data.activeTask?.start_km || 0;
    console.log('Mevcut KM değeri:', this.currentKm);
    
    this.kademeCikisForm = this.fb.group({
      islemAciklama: ['', Validators.required],
      sonuc: ['Onarıldı', Validators.required],
      degisenParcalar: [[]],
      notlar: [''],
      yeniKm: ['', [
        Validators.required, 
        this.kmValidator(this.currentKm)  // Özel validatör kullan
      ]]
    });
  }

  ngOnInit() {
    // Pasif wheel event listener ekleme - doğru şekilde yapılandırılmış
    document.addEventListener('wheel', this.handleWheel, { passive: true });
    
    console.log('Kademe çıkış modalı açıldı:', this.data);
    console.log('Araç:', this.data.vehicle);
    console.log('Aktif görev:', this.data.activeTask);
  }

  ngOnDestroy() {
    // Wheel event listener'ı kaldır - doğru referans ile
    document.removeEventListener('wheel', this.handleWheel);
  }

  private handleWheel = () => {
    // Boş fonksiyon - passive flag kullanıldığından içeriğe gerek yok
  };

  // Özel KM validatörü - start_km'den büyük olmalı
  kmValidator(startKm: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const kmValue = Number(control.value);
      if (isNaN(kmValue) || kmValue === null || kmValue === undefined) {
        return null; // Diğer validatörler boş kontrolünü zaten yapıyor
      }
      
      if (kmValue <= startKm) {
        return { 'minKm': { required: startKm + 1, actual: kmValue } };
      }
      
      return null;
    };
  }

  onSubmit() {
    if (this.kademeCikisForm.valid) {
      // KM değerinin uygun olduğunu çift kontrol et
      const yeniKm = Number(this.kademeCikisForm.get('yeniKm')?.value);
      if (yeniKm <= this.currentKm) {
        this.kademeCikisForm.get('yeniKm')?.setErrors({'minKm': true});
        return;
      }
      
      console.log('Form gönderiliyor:', this.kademeCikisForm.value);
      this.dialogRef.close(this.kademeCikisForm.value);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
