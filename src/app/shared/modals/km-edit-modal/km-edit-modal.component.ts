import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Task } from '../../../interfaces/task.interface';
import { A11yModule } from '@angular/cdk/a11y';

@Component({
  selector: 'app-km-edit-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    A11yModule
  ],
  template: `
    <h2 mat-dialog-title id="km-edit-dialog-title">KM Bilgisi Düzenle</h2>
    <mat-dialog-content cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
      <form [formGroup]="kmForm">
        <div class="form-container">
          <p>
            <strong>Araç:</strong> {{data.vehicle.military_plate}} ({{data.vehicle.brand}} {{data.vehicle.model}})
          </p>
          <p>
            <strong>Görev:</strong> {{data.task.task_paper_no}} - {{data.task.route_description}}
          </p>
          <p>
            <strong>Çıkış KM:</strong> {{data.task.start_km}}
          </p>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Geliş KM</mat-label>
            <input 
              matInput 
              type="number" 
              formControlName="endKm"
              placeholder="Geliş KM bilgisini giriniz"
              aria-label="Geliş KM değeri">
            <mat-error *ngIf="kmForm.get('endKm')?.hasError('required')">
              Geliş KM zorunludur
            </mat-error>
            <mat-error *ngIf="kmForm.get('endKm')?.hasError('min')">
              Geliş KM, çıkış KM'den büyük olmalıdır
            </mat-error>
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Düzenleme Nedeni</mat-label>
            <textarea 
              matInput 
              rows="2" 
              formControlName="reason"
              placeholder="Neden KM bilgisi değiştiriliyor?"
              aria-label="Düzenleme nedeni"></textarea>
            <mat-error *ngIf="kmForm.get('reason')?.hasError('required')">
              Düzenleme nedeni zorunludur
            </mat-error>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>İptal</button>
      <button 
        mat-raised-button 
        color="primary" 
        [disabled]="kmForm.invalid"
        (click)="save()">Kaydet</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-container {
      min-width: 350px;
    }
    .full-width {
      width: 100%;
    }
  `]
})
export class KmEditModalComponent implements OnInit {
  kmForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<KmEditModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      task: Task,
      vehicle: any
    }
  ) {
    this.kmForm = this.fb.group({
      endKm: [data.task.end_km, [
        Validators.required, 
        Validators.min(data.task.start_km + 1)
      ]],
      reason: ['', Validators.required]
    });
    
    // Set proper ARIA role for dialog
    this.dialogRef.addPanelClass('a11y-dialog');
  }

  ngOnInit(): void {}

  save(): void {
    if (this.kmForm.valid) {
      this.dialogRef.close({
        taskId: this.data.task.id,
        endKm: this.kmForm.value.endKm,
        reason: this.kmForm.value.reason
      });
    }
  }
}
