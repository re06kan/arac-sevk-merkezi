import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-km-edit-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>KM Bilgisi Düzenle</h2>

    <mat-dialog-content>
      <div class="vehicle-info">
        <p><strong>Araç:</strong> {{data.vehicle?.military_plate}} ({{data.vehicle?.civilian_plate}})</p>
        <p><strong>Görev Tarihi:</strong> {{data.task?.created_at | date:'dd.MM.yyyy HH:mm'}}</p>
      </div>

      <form [formGroup]="kmEditForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Çıkış KM</mat-label>
          <input matInput type="number" formControlName="startKm" placeholder="Çıkış KM'sini giriniz">
          <mat-error *ngIf="kmEditForm.get('startKm')?.hasError('required')">
            Çıkış KM'si gereklidir
          </mat-error>
          <mat-error *ngIf="kmEditForm.get('startKm')?.hasError('min')">
            Çıkış KM'si 0'dan büyük olmalıdır
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Geliş KM</mat-label>
          <input matInput type="number" formControlName="endKm" placeholder="Geliş KM'sini giriniz">
          <mat-error *ngIf="kmEditForm.get('endKm')?.hasError('required')">
            Geliş KM'si gereklidir
          </mat-error>
          <mat-error *ngIf="kmEditForm.get('endKm')?.hasError('min')">
            Geliş KM'si çıkış KM'sinden büyük olmalıdır
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Değişiklik Sebebi</mat-label>
          <textarea matInput formControlName="reason" rows="3" placeholder="KM değişiklik sebebini giriniz"></textarea>
          <mat-error *ngIf="kmEditForm.get('reason')?.hasError('required')">
            Değişiklik sebebi gereklidir
          </mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="onCancel()">İptal</button>
      <button
        mat-raised-button
        color="primary"
        type="button"
        [disabled]="!kmEditForm.valid"
        (click)="onSave()">
        Kaydet
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .vehicle-info {
      background-color: #f8f9fa;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .vehicle-info p {
      margin: 4px 0;
    }

    .vehicle-info strong {
      color: #1976d2;
      margin-right: 8px;
    }
  `]
})
export class KmEditModalComponent {
  kmEditForm: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<KmEditModalComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.kmEditForm = this.fb.group({
      startKm: [data.task?.start_km || 0, [Validators.required, Validators.min(0)]],
      endKm: [data.task?.end_km || 0, [Validators.required, Validators.min(0)]],
      reason: ['', Validators.required]
    }, { validators: this.kmValidator });

    // Erişilebilirlik ayarları
    this.dialogRef.disableClose = false;
  }

  // Çıkış KM ve Geliş KM validasyonu
  kmValidator(form: FormGroup) {
    const startKm = form.get('startKm')?.value;
    const endKm = form.get('endKm')?.value;

    if (startKm !== null && endKm !== null && endKm <= startKm) {
      form.get('endKm')?.setErrors({ min: true });
      return { invalidKm: true };
    }

    return null;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.kmEditForm.valid) {
      this.dialogRef.close({
        taskId: this.data.task.id,
        startKm: this.kmEditForm.value.startKm,
        endKm: this.kmEditForm.value.endKm,
        reason: this.kmEditForm.value.reason
      });
    }
  }
}
//       throw error;
