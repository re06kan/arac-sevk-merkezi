import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface LogDetailsData {
  id: number;
  action_type: string;
  vehicle_id: number;
  vehicle_military_plate?: string;
  vehicle_civilian_plate?: string;
  vehicle_plate?: string;
  username: string;
  fullname: string;
  ip_address: string;
  created_at: string;
  action_details: any;
  taskId?: number;
}

@Component({
  selector: 'app-log-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './log-details-dialog.component.html',
  styleUrls: ['./log-details-dialog.component.scss']
})
export class LogDetailsDialogComponent implements OnInit {
  actionTypeLabels: { [key: string]: string } = {
    'GOREV_AC': 'Görev Açma',
    'GOREV_KAPAT': 'Görev Kapatma',
    'UZUN_YOL': 'Uzun Yol',
    'KADEME_GIRIS': 'Kademe Giriş',
    'KADEME_CIKIS': 'Kademe Çıkış'
  };

  constructor(
    public dialogRef: MatDialogRef<LogDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LogDetailsData
  ) {}

  ngOnInit(): void {
    console.log('Log detayları:', this.data);
  }

  getActionTypeLabel(): string {
    return this.actionTypeLabels[this.data.action_type] || this.data.action_type;
  }

  getActionColor(): string {
    switch (this.data.action_type) {
      case 'GOREV_AC': return '#4caf50'; // yeşil
      case 'GOREV_KAPAT': return '#f44336'; // kırmızı
      case 'UZUN_YOL': return '#2196f3'; // mavi
      case 'KADEME_GIRIS': return '#ff9800'; // turuncu
      case 'KADEME_CIKIS': return '#9c27b0'; // mor
      default: return '#757575'; // gri
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}
