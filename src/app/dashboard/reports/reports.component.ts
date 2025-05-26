import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { TurkishDateAdapter } from '../../shared/turkish-date-adapter';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartType } from 'chart.js';
import { registerables } from 'chart.js';
import { VehicleService } from '../../services/vehicle.service';
import { TaskService } from '../../services/task.service';
import { DriverService } from '../../services/driver.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { LogService } from '../../services/log.service';
import { MatDialog } from '@angular/material/dialog';
import { LogDetailsDialogComponent } from './log-details-dialog/log-details-dialog.component';

// Excel ve PDF için gerekli importlar
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// jsPDF-AutoTable için tip tanımlaması
interface jsPDFWithAutoTable extends Omit<jsPDF, 'setFontSize'> {
  previousAutoTable?: {
    finalY: number;
  };
  setFontSize(size: number): jsPDF; // Explicitly add setFontSize to the interface
}

// Chart.js veri tipleri için yerel tip tanımlamaları
interface ChartData<T extends ChartType = ChartType> {
  labels?: string[];
  datasets: {
    data: number[];
    backgroundColor?: string[];
    label?: string;
  }[];
}

interface ChartOptions {
  responsive?: boolean;
  plugins?: any;
  scales?: any;
}

// Interface for vehicle object structure
interface Vehicle {
  id: number;
  military_plate: string;
  civilian_plate: string;
  brand?: string;
  model?: string;
  type?: string;
}

// Interface for driver object structure
interface Driver {
  id: number;
  name: string;
  rutbe?: string;
  sicil_no?: string;
}

// Interface for personnel object structure
interface Personnel {
  id: number;
  name: string;
  rank?: string;
  visibility?: number;  // Add the visibility property
}

// Tablo için model tanımlaması
interface TaskReportItem {
  id: number;
  start_date: string;
  end_date: string;
  vehicle_id: number;
  military_plate: string;
  civilian_plate: string;
  driver_name?: string;
  task_type: string;
  task_status: string;
  start_km: number;
  end_km: number;
  total_km: number;
  duration_hours: number;
  route_description?: string;
}

// LogEntry için model tanımlaması
interface LogEntry {
  id: number;
  task_id: number;
  user_id: number;
  action_type: string;
  vehicle_id: number;
  action_details: any;
  ip_address: string;
  created_at: string;
  username: string;
  fullname: string;
  vehicle_plate?: string;
  vehicle_military_plate?: string;
  vehicle_civilian_plate?: string;
}

const TURKISH_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  standalone: true,
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'tr-TR' },
    { provide: DateAdapter, useClass: TurkishDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: TURKISH_DATE_FORMATS }
  ],
  imports: [
    CommonModule, 
    MatCardModule, 
    MatIconModule, 
    MatDividerModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatTableModule,
    MatTabsModule,
    MatPaginatorModule,
    MatSortModule,
    MatCheckboxModule,
    BaseChartDirective,
    MatSnackBarModule,
    FormsModule
  ]
})
export class ReportsComponent implements OnInit {
  filterForm: FormGroup;
  reportData: any = null;
  vehicleGroups: any[] = [];
  filteredVehicleGroups: any[] = [];
  vehicles: any[] = [];
  allVehicles: number[] = [];
  drivers: Driver[] = [];
  filteredDrivers: Driver[] = [];
  allDrivers: number[] = [];
  personnel: Personnel[] = [];
  filteredPersonnel: Personnel[] = [];
  allPersonnel: number[] = [];
  displayedColumns: string[] = [
    'start_date',
    'military_plate', 
    'driver_name',
    'assigned_authority',
    'ordered_by',
    'task_paper_no',
    'task_type',
    'route_description',
    'start_km',
    'end_km',
    'end_date', // Yeni eklenen bitiş tarihi sütunu
    'total_km',
    'duration_hours',
    'task_status',
    'return_message'
  ];
  tableDataSource: any;
  noDataMessage: string = '';

  logDataSource = new MatTableDataSource<LogEntry>([]);
  logColumns: string[] = ['created_at', 'action_type', 'vehicle', 'user', 'ip_address', 'details'];
  selectedActionType: string = 'all';
  logStartDate: Date | null = null;
  logEndDate: Date | null = null;

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('logPaginator') logPaginator!: MatPaginator;

  public taskDistributionData: ChartData<'pie'> = {
    labels: ['Normal Görev', 'Uzun Yol', 'Kademe'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#4CAF50', '#2196F3', '#FF9800']
    }]
  };

  public timelineData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Günlük Görev Sayısı',
      data: [],
      backgroundColor: ['#1976d2']
    }]
  };

  public chartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: {
        display: true,
        text: 'Görev Dağılımı'
      }
    }
  };

  public timelineOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: {
        display: true,
        text: 'Günlük Görev Dağılımı'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    }
  };

  public driverStatsData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Görev Sayısı',
      data: [],
      backgroundColor: ['#3f51b5']
    }]
  };

  public driverStatsOptions = {
    responsive: true,
    indexAxis: 'y',
    plugins: {
      legend: { display: true },
      title: {
        display: true,
        text: 'Tüm Sürücülerin Görev İstatistikleri'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      },
      x: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    },
    maintainAspectRatio: false
  } as any;

  vehicleTypes: {value: string, label: string}[] = [];
  taskTypes: string[] = [];

  constructor(
    private fb: FormBuilder,
    private vehicleService: VehicleService,
    private taskService: TaskService,
    private driverService: DriverService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private logService: LogService,
    private dialog: MatDialog
  ) {
    this.filterForm = this.fb.group({
      vehicles: [[]],
      vehicleType: [[]],
      drivers: [[]],
      assignedAuthority: [[]],
      startDate: [''],
      endDate: [''],
      taskType: [[]]
    });

    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;
  }

  ngOnInit() {
    Chart.register(...registerables);
    this.loadVehicles();
    this.loadTaskTypes();
    this.loadDrivers();
    this.loadPersonnel();
  }

  ngAfterViewInit() {
    if (this.logPaginator) {
      this.logDataSource.paginator = this.logPaginator;
    }
  }

  generateReport() {
    if (this.filterForm.valid) {
      this.noDataMessage = '';
      console.log('Filtreler:', {
        Araçlar: this.filterForm.value.vehicles,
        'Araç Cinsi': this.filterForm.value.vehicleType,
        'Sürücüler': this.filterForm.value.drivers,
        'Tahsisli Makam': this.filterForm.value.assignedAuthority,
        'Başlangıç Tarihi': this.filterForm.value.startDate,
        'Bitiş Tarihi': this.filterForm.value.endDate,
        'Görev Tipi': this.filterForm.value.taskType
      });

      const filters = {
        vehicles: this.filterForm.value.vehicles || [],
        vehicleTypes: this.filterForm.value.vehicleType || [],
        drivers: this.filterForm.value.drivers || [],
        assignedAuthority: this.filterForm.value.assignedAuthority || [],
        taskTypes: this.filterForm.value.taskType || [],
        startDate: this.filterForm.value.startDate,
        endDate: this.filterForm.value.endDate
      };
      
      this.taskService.getTaskReport(filters).subscribe({
        next: (data) => {
          console.log('Rapor verisi:', data);
          
          if (!data || data.length === 0) {
            this.noDataMessage = 'Seçilen kriterlere uygun kayıt bulunamadı. Lütfen filtre seçimlerinizi kontrol edin.';
            this.reportData = null;
            return;
          }
          
          this.setupTableData(data);
          this.calculateSummaryStats(data);
          this.updateChartData(data);
        },
        error: (error) => {
          console.error('Rapor alınırken hata:', error);
          this.noDataMessage = 'Rapor verileri alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
          this.reportData = null;
        }
      });
    }
  }

  resetFilters() {
    this.filterForm.reset({
      vehicles: [],
      vehicleType: [],
      drivers: [],
      assignedAuthority: [],
      taskType: []
    });
    this.reportData = null;
  }

  exportToPDF() {
    if (!this.reportData || !this.tableDataSource) {
      console.error('PDF için veri bulunamadı');
      return;
    }
    
    try {
      // A4 boyutunda yatay PDF oluştur
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      }) as jsPDFWithAutoTable;
      
      // Varsayılan font kullan, harici font yükleme girişimini kaldır
      pdf.setFont("helvetica");
      
      // Başlık ekle
      pdf.setFontSize(18);
      pdf.text('Araç Görev Raporu', 14, 15);
      
      // Tarih aralığı bilgisini ekle
      const startDate = this.filterForm.value.startDate ? 
        new Date(this.filterForm.value.startDate).toLocaleDateString('tr-TR') : 'Başlangıç';
      const endDate = this.filterForm.value.endDate ? 
        new Date(this.filterForm.value.endDate).toLocaleDateString('tr-TR') : 'Bugün';
      
      pdf.setFontSize(12);
      pdf.text(`Tarih Aralığı: ${startDate} - ${endDate}`, 14, 25);
      
      // Özet bilgileri ekle
      pdf.text(`Toplam Görev: ${this.reportData.totalTasks}`, 14, 35);
      pdf.text(`Toplam KM: ${this.reportData.totalKm} KM`, 14, 42);
      pdf.text(`Toplam Süre: ${this.reportData.totalHours} Saat`, 14, 49);
      
      // Sürücü tablosu için başlık
      pdf.setFontSize(14);
      pdf.text('En Çok Göreve Çıkan Sürücüler', 14, 60);
      
      // En iyi sürücülerin tablosu
      const driverRows = this.reportData.topDrivers.map((driver: any, index: number) => [
        (index + 1).toString(), // Sıra
        driver.name, // Sürücü adı
        driver.rank || '', // Rütbe
        driver.taskCount.toString() // Görev sayısı
      ]);
      
      try {
        autoTable(pdf, {
          startY: 65,
          head: [['Sıra', 'Sürücü Adı', 'Rütbe', 'Görev Sayısı']],
          body: driverRows,
          theme: 'grid',
          headStyles: {
            fillColor: [63, 81, 181], // #3f51b5
            textColor: 255,
            halign: 'center',
            fontStyle: 'bold'
          },
          styles: {
            fontSize: 10
          }
        });
      } catch (err) {
        console.error('Sürücü tablosu oluşturma hatası:', err);
      }
      
      // Görev detayları tablosu
      const data = this.tableDataSource.filteredData || [];
      
      // Yeni sayfa için alan kontrolü
      const tableY = pdf.previousAutoTable ? pdf.previousAutoTable.finalY + 20 : 110;
      if (tableY > 180) { // Sayfanın sonuna yaklaştıysa
        pdf.addPage(); // Yeni sayfa ekle
      }
      
      pdf.setFontSize(14);
      pdf.text('Görev Detayları', 14, pdf.previousAutoTable ? pdf.previousAutoTable.finalY + 15 : 110);
      
      // Tablo verileri - En çok 20 kayıt göster
      const rows = data.slice(0, 20).map((task: any) => [
        new Date(task.start_date).toLocaleDateString('tr-TR'),
        // Askeri ve sivil plakayı birlikte göster
        task.military_plate ? 
          (task.civilian_plate ? `${task.military_plate}\n${task.civilian_plate}` : task.military_plate) : 
          task.civilian_plate || '',
        task.driver_name || '',
        task.task_type,
        task.start_km?.toString() || '',
        task.end_km?.toString() || '',
        task.total_km?.toString() || '',
        task.duration_hours ? Number(task.duration_hours).toFixed(1) : '',
        task.task_status,
        task.end_date ? new Date(task.end_date).toLocaleDateString('tr-TR') : '-' // Bitiş tarihini ekliyoruz
      ]);
      
      try {
        autoTable(pdf, {
          startY: pdf.previousAutoTable ? pdf.previousAutoTable.finalY + 20 : 115,
          head: [['Tarih', 'Plaka', 'Sürücü', 'Görev Tipi', 'Başl. KM', 'Bitiş KM', 'Toplam KM', 'Süre (Saat)', 'Durum', 'Bitiş Tarihi']],
          body: rows,
          theme: 'grid',
          headStyles: {
            fillColor: [63, 81, 181],
            textColor: 255,
            halign: 'center',
            fontStyle: 'bold'
          },
          styles: { 
            fontSize: 8, 
            cellPadding: 2
          }
        });
      } catch (err) {
        console.error('Görev tablosu oluşturma hatası:', err);
      }
      
      // Sayfa sayısını kontrol et ve bilgi ekle
      if (data.length > 20) {
        pdf.setFontSize(10);
        pdf.text(`* Tabloda sadece ilk 20 kayıt gösterilmektedir. Toplam ${data.length} kayıt bulunmaktadır.`, 
          14, (pdf.previousAutoTable?.finalY || 0) + 10);
      }
      
      // Altbilgi ekle
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(`Sayfa ${i} / ${pageCount} - ${new Date().toLocaleDateString('tr-TR')}`, 
          pdf.internal.pageSize.width - 40, pdf.internal.pageSize.height - 10);
      }
      
      // PDF dosyasını indir
      const filename = `Arac_Gorev_Raporu_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      alert('PDF oluşturulurken bir hata oluştu. Detaylar için konsolu kontrol edin.');
    }
  }

  exportReportsToPDF() {
    import('jspdf').then(jsPDF => {
      import('jspdf-autotable').then(autoTable => {
        const doc = new jsPDF.default({
          orientation: 'l',
          unit: 'mm',
          format: 'a4',
          putOnlyUsedFonts: true
        });
        
        // Font bağımlılığını azaltmak için mevcut fontları kullanın
        // veya base64 formatında gömülü fontlar kullanabilirsiniz
        
        // ...existing code...
      });
    });
  }

  exportToExcel() {
    if (!this.reportData || !this.tableDataSource) {
      console.error('Excel için veri bulunamadı');
      return;
    }
    
    // Yeni çalışma kitabı oluştur
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Araç Takip Sistemi';
    workbook.created = new Date();
    
    // Özet sayfası oluştur
    const summarySheet = workbook.addWorksheet('Özet');
    
    // Başlık stili
    const titleStyle = {
      font: { bold: true, size: 16 },
      alignment: { horizontal: 'center' as const }  // Type assertion ile düzeltildi
    };
    
    // Başlık satırı ekle
    summarySheet.mergeCells('A1:F1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = 'ARAÇ GÖREV RAPORU';
    titleCell.style = titleStyle;
    
    // Tarih aralığı
    const startDate = this.filterForm.value.startDate ? 
      new Date(this.filterForm.value.startDate).toLocaleDateString('tr-TR') : 'Başlangıç';
    const endDate = this.filterForm.value.endDate ? 
      new Date(this.filterForm.value.endDate).toLocaleDateString('tr-TR') : 'Bugün';
    
    summarySheet.mergeCells('A3:F3');
    summarySheet.getCell('A3').value = `Tarih Aralığı: ${startDate} - ${endDate}`;
    
    // Özet bilgiler
    summarySheet.getCell('A5').value = 'Toplam Görev:';
    summarySheet.getCell('B5').value = this.reportData.totalTasks;
    
    summarySheet.getCell('A6').value = 'Toplam KM:';
    summarySheet.getCell('B6').value = this.reportData.totalKm + ' KM';
    
    summarySheet.getCell('A7').value = 'Toplam Süre:';
    summarySheet.getCell('B7').value = this.reportData.totalHours + ' Saat';
    
    // En iyi sürücüler için başlık
    summarySheet.mergeCells('A9:D9');
    const driversTitle = summarySheet.getCell('A9');
    driversTitle.value = 'EN ÇOK GÖREVE ÇIKAN SÜRÜCÜLER';
    driversTitle.style = { font: { bold: true, size: 12 } };
    
    // Sürücü tablosu başlıkları
    summarySheet.getCell('A10').value = 'Sıra';
    summarySheet.getCell('B10').value = 'Sürücü Adı';
    summarySheet.getCell('C10').value = 'Rütbe';
    summarySheet.getCell('D10').value = 'Görev Sayısı';
    
    // Başlık stilini ayarla
    ['A10', 'B10', 'C10', 'D10'].forEach(cell => {
      summarySheet.getCell(cell).style = { 
        font: { bold: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '3F51B5' } },
        alignment: { horizontal: 'center' },
        border: {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        }
      };
    });
    
    // Sürücü verilerini ekle
    this.reportData.topDrivers.forEach((driver: any, idx: number) => {
      const rowIndex = 11 + idx;
      summarySheet.getCell(`A${rowIndex}`).value = idx + 1;
      summarySheet.getCell(`B${rowIndex}`).value = driver.name;
      summarySheet.getCell(`C${rowIndex}`).value = driver.rank || '';
      summarySheet.getCell(`D${rowIndex}`).value = driver.taskCount;
      
      // Hücre çerçevelerini ayarla
      ['A', 'B', 'C', 'D'].forEach(col => {
        summarySheet.getCell(`${col}${rowIndex}`).style = {
          border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
        };
      });
    });
    
    // Kolon genişliklerini ayarla
    summarySheet.getColumn('A').width = 10;
    summarySheet.getColumn('B').width = 30;
    summarySheet.getColumn('C').width = 15;
    summarySheet.getColumn('D').width = 15;
    
    // Detay sayfası oluştur
    const detailSheet = workbook.addWorksheet('Görev Detayları');
    
    // Başlık satırı ekle
    detailSheet.mergeCells('A1:K1');
    const detailTitle = detailSheet.getCell('A1');
    detailTitle.value = 'ARAÇ GÖREV DETAYLARI';
    detailTitle.style = titleStyle;
    
    // Detay tablosu başlıkları
    const headers = [
      'Tarih', 
      'Plaka', 
      'Sürücü',
      'Tahsisli Makam', 
      'Görev Tipi', 
      'Güzergah',
      'Başlangıç KM', 
      'Bitiş KM', 
      'Toplam KM', 
      'Süre (Saat)', 
      'Durum',
      'Bitiş Tarihi' // Yeni eklenen sütun
    ];
    
    // Başlık stilini ayarla
    headers.forEach((header, idx) => {
      const col = String.fromCharCode(65 + idx); // A, B, C, ... K
      detailSheet.getCell(`${col}3`).value = header;
      detailSheet.getCell(`${col}3`).style = {
        font: { bold: true, color: { argb: 'FFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '3F51B5' } },
        alignment: { horizontal: 'center' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      };
    });
    
    // Verileri ekle
    const data = this.tableDataSource.filteredData || [];
    
    data.forEach((task: any, idx: number) => {
      const rowIndex = 4 + idx;
      
      detailSheet.getCell(`A${rowIndex}`).value = new Date(task.start_date).toLocaleDateString('tr-TR');
      
      // Askeri ve sivil plakayı alt alta göster
      if (task.military_plate && task.civilian_plate) {
        detailSheet.getCell(`B${rowIndex}`).value = `${task.military_plate}\n${task.civilian_plate}`;
        // Excel'de alt alta metinler için hücre boyutunu ayarla
        detailSheet.getRow(rowIndex).height = 30;
        detailSheet.getCell(`B${rowIndex}`).alignment = {
          vertical: 'middle', 
          wrapText: true
        };
      } else {
        detailSheet.getCell(`B${rowIndex}`).value = task.military_plate || task.civilian_plate || '';
      }
      
      detailSheet.getCell(`C${rowIndex}`).value = task.driver_name || '';
      detailSheet.getCell(`D${rowIndex}`).value = task.authority_name || '';
      detailSheet.getCell(`E${rowIndex}`).value = task.task_type;
      detailSheet.getCell(`F${rowIndex}`).value = task.route_description || '';
      detailSheet.getCell(`G${rowIndex}`).value = task.start_km;
      detailSheet.getCell(`H${rowIndex}`).value = task.end_km || '';
      detailSheet.getCell(`I${rowIndex}`).value = task.total_km || '';
      // Number değerine dönüştürdük
      detailSheet.getCell(`J${rowIndex}`).value = task.duration_hours ? Number(task.duration_hours).toFixed(1) : '';
      detailSheet.getCell(`K${rowIndex}`).value = task.task_status;
      detailSheet.getCell(`L${rowIndex}`).value = task.end_date ? new Date(task.end_date).toLocaleDateString('tr-TR') : '-'; // Bitiş tarihini ekliyoruz
      
      // Hücre çerçevelerini ayarla
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].forEach(col => {
        detailSheet.getCell(`${col}${rowIndex}`).style = {
          border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
        };
      });
    });
    
    // Kolon genişliklerini ayarla
    detailSheet.getColumn('A').width = 15; // Tarih
    detailSheet.getColumn('B').width = 15; // Plaka
    detailSheet.getColumn('C').width = 20; // Sürücü
    detailSheet.getColumn('D').width = 25; // Tahsisli Makam
    detailSheet.getColumn('E').width = 15; // Görev Tipi
    detailSheet.getColumn('F').width = 30; // Güzergah
    detailSheet.getColumn('G').width = 15; // Başlangıç KM
    detailSheet.getColumn('H').width = 15; // Bitiş KM
    detailSheet.getColumn('I').width = 12; // Toplam KM
    detailSheet.getColumn('J').width = 12; // Süre
    detailSheet.getColumn('K').width = 12; // Durum
    detailSheet.getColumn('L').width = 20; // Bitiş Tarihi
    
    // Excel dosyasını indir
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const filename = `Arac_Gorev_Raporu_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.xlsx`;
      saveAs(blob, filename);
    });
  }

  exportLogsToPDF() {
    if (this.logDataSource.data.length === 0) {
      this.snackBar.open('Aktarılacak log kaydı bulunamadı', 'Tamam', {
        duration: 3000, 
        panelClass: ['warning-snackbar']
      });
      return;
    }

    import('jspdf').then(jsPDF => {
      import('jspdf-autotable').then(autoTable => {
        // UTF-8 desteği için özel karakter tanımlamaları
        const customFont = {
          normal: 'Helvetica',
          bold: 'Helvetica-Bold',
          italic: 'Helvetica-Oblique',
          bolditalic: 'Helvetica-BoldOblique'
        };
        
        const doc = new jsPDF.default({
          orientation: 'l',
          unit: 'mm',
          format: 'a4',
          putOnlyUsedFonts: true,
          floatPrecision: 16
        });
        
        // PDF Türkçe karakter desteği için ekstra ayarlar
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(11);
        
        // Türkçe başlık için özel kodlama
        const title = 'Sistem Log Kayitlari';
        doc.text(title, 14, 22);
        
        // Filtreleme bilgileri - Türkçe karakterleri elle kodla
        doc.setFontSize(11);
        doc.setTextColor(100);
        
        let filterInfo = 'islem tipi: ';  // 'İşlem' kelimesinde 'ş' harfi sorun çıkarabilir
        filterInfo += this.selectedActionType === 'all' ? 'Tümü' : this.getActionTypeLabel(this.selectedActionType);
        
        doc.text(filterInfo, 14, 30);
        
        let dateInfo = '';
        if (this.logStartDate) {
          dateInfo += `Baslangıc: ${this.formatDate(this.logStartDate)}`;
        }
        
        if (this.logEndDate) {
          dateInfo += dateInfo ? ` | Bitis: ${this.formatDate(this.logEndDate)}` : `Bitis: ${this.formatDate(this.logEndDate)}`;
        }
        
        if (dateInfo) {
          doc.text(dateInfo, 14, 36);
        }
        
        // Tarih bilgisi
        doc.setFontSize(10);
        doc.text(`Olusturulma: ${new Date().toLocaleString('tr-TR')}`, 14, 42);
        
        // Tablo verileri - Türkçe karakterleri ASCII karşılıklarıyla değiştir
        const tableColumn = ['Tarih', 'Islem', 'Arac', 'Kullanici', 'IP Adresi'];
        const tableRows: any[] = [];

        this.logDataSource.data.forEach(log => {
          const logDate = new Date(log.created_at).toLocaleString('tr-TR');
          const vehicleText = log.vehicle_military_plate ? 
            `${log.vehicle_military_plate}${log.vehicle_civilian_plate ? ' / ' + log.vehicle_civilian_plate : ''}` : 
            (log.vehicle_civilian_plate || '-');
            
          // Türkçe karakter içerebilen metin değerleri için ASCII karşılıkları
          const actionType = this.turkishToAscii(this.getActionTypeLabel(log.action_type));
          const username = this.turkishToAscii(log.username || '');
            
          tableRows.push([
            logDate,
            actionType,
            vehicleText,
            username,
            log.ip_address || '-'
          ]);
        });

        // Tablo oluşturma
        autoTable.default(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 45,
          styles: {
            fontSize: 9,
            cellPadding: 3,
            valign: 'middle',
            font: 'Helvetica',
            lineColor: [200, 200, 200],
          },
          headStyles: {
            fillColor: [66, 139, 202],
            textColor: [255, 255, 255],
            fontSize: 10,
            halign: 'center',
            font: 'Helvetica',
            fontStyle: 'bold',
          },
          didDrawPage: (data) => {
            // Her sayfa için footer ekleyelim
            const pageCount = doc.getNumberOfPages();
            const currentPage = doc.getCurrentPageInfo().pageNumber;
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Sayfa ${currentPage} / ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
          }
        });

        // PDF dosyasını indir
        doc.save('sistem-loglari.pdf');
      });
    });
  }

  private turkishToAscii(text: string): string {
    if (!text) return '';
    
    const replacements: {[key: string]: string} = {
      'ı': 'i', 'İ': 'I', 'ş': 's', 'Ş': 'S',
      'ğ': 'g', 'Ğ': 'G', 'ü': 'u', 'Ü': 'U',
      'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C'
    };
    
    return text.replace(/[ıİşŞğĞüÜöÖçÇ]/g, match => replacements[match] || match);
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  }

  loadVehicles() {
    this.vehicleService.getVehicles().subscribe({
      next: (data) => {
        this.vehicles = data;
        const groupedVehicles: {[key: string]: any[]} = {};
        this.allVehicles = [];
        const uniqueTypes = new Set<string>();
        
        this.vehicles.forEach(vehicle => {
          if (vehicle.type) {
            uniqueTypes.add(vehicle.type);
          }
          
          const vehicleType = vehicle.type || 'Diğer';
          
          if (!groupedVehicles[vehicleType]) {
            groupedVehicles[vehicleType] = [];
          }
          
          const vehicleData = {
            id: vehicle.id,
            military_plate: vehicle.military_plate,
            civilian_plate: vehicle.civilian_plate,
            brand: vehicle.brand,
            model: vehicle.model
          };
          
          groupedVehicles[vehicleType].push(vehicleData);
          this.allVehicles.push(vehicle.id);
        });
        
        this.vehicleTypes = [];
        uniqueTypes.forEach(type => {
          this.vehicleTypes.push({
            value: type,
            label: this.formatVehicleTypeLabel(type)
          });
        });
        
        if (this.vehicleTypes.length === 0) {
          this.vehicleTypes.push({ value: 'OTHER', label: 'Diğer' });
        }
        
        this.vehicleGroups = Object.keys(groupedVehicles).map(type => ({
          type,
          vehicles: groupedVehicles[type]
        }));
        
        this.filteredVehicleGroups = [...this.vehicleGroups];
        
        console.log('Araç grupları yüklendi:', this.vehicleGroups);
        console.log('Araç tipleri:', this.vehicleTypes);
      },
      error: (error) => {
        console.error('Araçlar yüklenirken hata oluştu:', error);
      }
    });
  }

  loadTaskTypes() {
    this.taskService.getDistinctTaskTypes().subscribe({
      next: (taskTypes) => {
        this.taskTypes = taskTypes;
        console.log('Görev tipleri yüklendi:', this.taskTypes);
      },
      error: (error) => {
        console.error('Görev tipleri yüklenirken hata oluştu:', error);
      }
    });
  }

  loadDrivers() {
    this.driverService.getDrivers().subscribe({
      next: (data) => {
        this.drivers = data.filter(driver => driver.visibility === 0);
        this.filteredDrivers = [...this.drivers];
        this.allDrivers = this.drivers.map(driver => driver.id);
        console.log('Sürücüler yüklendi:', this.drivers);
      },
      error: (error) => {
        console.error('Sürücüler yüklenirken hata oluştu:', error);
      }
    });
  }

  loadPersonnel() {
    const apiUrl = 'http://localhost:3000/api/personnel';
    
    this.http.get<Personnel[]>(apiUrl).subscribe({
      next: (data) => {
        this.personnel = data;
        this.filteredPersonnel = [...this.personnel];
        this.allPersonnel = this.personnel.map(p => p.id);
        console.log('Personel yüklendi:', this.personnel);
      },
      error: (error) => {
        console.error('Personel yüklenirken hata oluştu:', error);
      }
    });
  }

  setupTableData(data: any[]) {
    this.tableDataSource = new MatTableDataSource<TaskReportItem>(data);
    
    this.tableDataSource.filterPredicate = (data: any, filter: string) => {
      const dataStr = Object.values(data)
        .filter(val => val !== null && val !== undefined)
        .join(' ')
        .toLowerCase();
      return dataStr.includes(filter.toLowerCase());
    };
    
    setTimeout(() => {
      if (this.paginator) {
        this.tableDataSource.paginator = this.paginator;
      }
      if (this.sort) {
        this.tableDataSource.sort = this.sort;
      }
    });
  }
  
  calculateSummaryStats(data: any[]) {
    if (!data || data.length === 0) {
      this.reportData = null;
      return;
    }
    
    const totalKm = data.reduce((sum, task) => {
      const kmValue = task.total_km ? parseFloat(task.total_km) : 0;
      return sum + kmValue;
    }, 0);
    
    const totalHours = data.reduce((sum, task) => {
      const hoursValue = task.duration_hours ? parseFloat(task.duration_hours) : 0;
      return sum + hoursValue;
    }, 0);
    
    const driverStats: {[key: string]: {id: number, name: string, rank?: string, taskCount: number}} = {};
    data.forEach(task => {
      if (task.driver_id && task.driver_name) {
        driverStats[task.driver_id] = driverStats[task.driver_id] || {
          id: task.driver_id,
          name: task.driver_name,
          rank: task.driver_rank || '',
          taskCount: 0
        };
        driverStats[task.driver_id].taskCount++;
      }
    });
    
    const topDrivers = Object.values(driverStats)
      .sort((a, b) => b.taskCount - a.taskCount)
      .slice(0, 10);
    
    this.reportData = {
      totalTasks: data.length,
      totalKm: totalKm.toFixed(0),
      totalHours: totalHours.toFixed(1),
      topDrivers: topDrivers
    };
  }
  
  updateChartData(data: any[]) {
    if (!data || data.length === 0) return;
    
    const taskTypeCounts: {[key: string]: number} = {};
    data.forEach(task => {
      const type = task.task_type || 'Belirtilmemiş';
      taskTypeCounts[type] = (taskTypeCounts[type] || 0) + 1;
    });
    
    const labels = Object.keys(taskTypeCounts);
    const counts = labels.map(label => taskTypeCounts[label]);
    
    this.taskDistributionData.labels = labels;
    this.taskDistributionData.datasets[0].data = counts;
    
    const dateGroups: {[key: string]: number} = {};
    data.forEach(task => {
      const date = new Date(task.start_date).toLocaleDateString('tr-TR');
      dateGroups[date] = (dateGroups[date] || 0) + 1;
    });
    
    const dates = Object.keys(dateGroups);
    const taskCounts = dates.map(date => dateGroups[date]);
    
    this.timelineData.labels = dates;
    this.timelineData.datasets[0].data = taskCounts;
    
    const driverStats: {[key: string]: {id: number, name: string, rank?: string, taskCount: number}} = {};
    data.forEach(task => {
      if (task.driver_id && task.driver_name && task.driver_visibility === 0) {
        const driverKey = task.driver_id.toString();
        driverStats[driverKey] = driverStats[driverKey] || {
          id: task.driver_id,
          name: task.driver_name,
          rank: task.driver_rank || '',
          taskCount: 0
        };
        driverStats[driverKey].taskCount++;
      }
    });
    
    const allDrivers = Object.values(driverStats)
      .sort((a, b) => b.taskCount - a.taskCount);
      
    this.driverStatsData.labels = allDrivers.map(driver => 
      driver.name + (driver.rank ? ` (${driver.rank})` : '')
    );
    this.driverStatsData.datasets[0].data = allDrivers.map(driver => driver.taskCount);
    
    this.reportData.topDrivers = allDrivers.slice(0, 10);
    
    if (this.chart) {
      this.chart.update();
    }
  }

  getVehicleTypeLabel(typeValue: string): string {
    if (!typeValue) return 'Diğer';
    
    const type = this.vehicleTypes.find(t => t.value === typeValue);
    return type ? type.label : this.formatVehicleTypeLabel(typeValue);
  }

  private formatVehicleTypeLabel(type: string): string {
    if (!type) return 'Diğer';
    
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  }

  filterVehicles(searchText: string) {
    if (!searchText) {
      this.filteredVehicleGroups = [...this.vehicleGroups];
      return;
    }
    
    searchText = searchText.toLowerCase();
    
    this.filteredVehicleGroups = this.vehicleGroups.map(group => {
      return {
        type: group.type,
        vehicles: group.vehicles.filter((vehicle: Vehicle) => 
          vehicle.military_plate.toLowerCase().includes(searchText) || 
          vehicle.civilian_plate.toLowerCase().includes(searchText)
        )
      };
    });
  }
  
  toggleAllVehicles(selectAll: boolean) {
    if (selectAll) {
      this.filterForm.get('vehicles')?.setValue(this.allVehicles);
    } else {
      this.filterForm.get('vehicles')?.setValue([]);
    }
  }
  
  isAllVehiclesSelected(): boolean {
    const selectedVehicles = this.filterForm.get('vehicles')?.value || [];
    return this.allVehicles.length > 0 && selectedVehicles.length === this.allVehicles.length;
  }
  
  isSomeVehiclesSelected(): boolean {
    const selectedVehicles = this.filterForm.get('vehicles')?.value || [];
    return selectedVehicles.length > 0 && selectedVehicles.length < this.allVehicles.length;
  }
  
  getSelectedVehiclesText(): string {
    const selectedVehicles = this.filterForm.get('vehicles')?.value || [];
    if (selectedVehicles.length === this.allVehicles.length) {
      return `Tüm araçlar (${selectedVehicles.length})`;
    }
    return `${selectedVehicles.length} araç seçildi`;
  }

  filterDrivers(searchText: string) {
    if (!searchText) {
      this.filteredDrivers = [...this.drivers];
      return;
    }
    
    searchText = searchText.toLowerCase();
    
    this.filteredDrivers = this.drivers.filter(driver => 
      driver.name.toLowerCase().includes(searchText) ||
      (driver.rutbe && driver.rutbe.toLowerCase().includes(searchText)) ||
      (driver.sicil_no && driver.sicil_no.toLowerCase().includes(searchText))
    );
  }
  
  toggleAllDrivers(selectAll: boolean) {
    if (selectAll) {
      this.filterForm.get('drivers')?.setValue([...this.allDrivers]);
    } else {
      this.filterForm.get('drivers')?.setValue([]);
    }
  }
  
  isAllDriversSelected(): boolean {
    const selectedDrivers = this.filterForm.get('drivers')?.value || [];
    return this.allDrivers.length > 0 && selectedDrivers.length === this.allDrivers.length;
  }
  
  isSomeDriversSelected(): boolean {
    const selectedDrivers = this.filterForm.get('drivers')?.value || [];
    return selectedDrivers.length > 0 && selectedDrivers.length < this.allDrivers.length;
  }
  
  getSelectedDriversText(): string {
    const selectedDrivers = this.filterForm.get('drivers')?.value || [];
    if (selectedDrivers.length === this.allDrivers.length) {
      return `Tüm sürücüler (${selectedDrivers.length})`;
    }
    return `${selectedDrivers.length} sürücü seçildi`;
  }

  filterPersonnel(searchText: string) {
    if (!searchText) {
      this.filteredPersonnel = [...this.personnel];
      return;
    }
    
    searchText = searchText.toLowerCase();
    
    this.filteredPersonnel = this.personnel.filter(p => 
      p.name.toLowerCase().includes(searchText) ||
      (p.rank && p.rank.toLowerCase().includes(searchText))
    );
  }
  
  toggleAllPersonnel(selectAll: boolean) {
    if (selectAll) {
      this.filterForm.get('assignedAuthority')?.setValue([...this.allPersonnel]);
    } else {
      this.filterForm.get('assignedAuthority')?.setValue([]);
    }
  }
  
  isAllPersonnelSelected(): boolean {
    const selectedPersonnel = this.filterForm.get('assignedAuthority')?.value || [];
    return this.allPersonnel.length > 0 && selectedPersonnel.length === this.allPersonnel.length;
  }
  
  isSomePersonnelSelected(): boolean {
    const selectedPersonnel = this.filterForm.get('assignedAuthority')?.value || [];
    return selectedPersonnel.length > 0 && selectedPersonnel.length < this.allPersonnel.length;
  }
  
  getSelectedPersonnelText(): string {
    const selectedPersonnel = this.filterForm.get('assignedAuthority')?.value || [];
    if (selectedPersonnel.length === this.allPersonnel.length) {
      return `Tüm makamlar (${selectedPersonnel.length})`;
    }
    return `${selectedPersonnel.length} makam seçildi`;
  }

  applyTableFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.tableDataSource.filterPredicate = (data: any, filter: string) => {
      const dataStr = Object.values(data)
        .filter(val => val !== null && val !== undefined)
        .join(' ')
        .toLowerCase();
      return dataStr.includes(filter.toLowerCase());
    };
    this.tableDataSource.filter = filterValue.trim().toLowerCase();

    if (this.tableDataSource.paginator) {
      this.tableDataSource.paginator.firstPage();
    }
  }

  searchLogs() {
    // Log filtrelerini oluştur
    const filters: any = {};
    
    if (this.selectedActionType !== 'all') {
      filters.actionType = this.selectedActionType;
    }
    
    if (this.logStartDate) {
      filters.startDate = this.logStartDate;
    }
    
    if (this.logEndDate) {
      filters.endDate = this.logEndDate;
    }
    
    // Logları getir
    this.logService.getAllLogs(filters).subscribe({
      next: (logs) => {
        console.log('Alınan loglar:', logs);
        this.logDataSource.data = logs;
        
        if (this.logDataSource.data.length === 0) {
          this.snackBar.open('Seçilen kriterlere uygun log kaydı bulunamadı', 'Tamam', {
            duration: 3000,
            panelClass: ['warning-snackbar']
          });
        }
      },
      error: (error) => {
        console.error('Log kayıtları alınamadı:', error);
        this.snackBar.open('Log kayıtları alınamadı', 'Tamam', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  showLogDetails(log: LogEntry) {
    this.dialog.open(LogDetailsDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        ...log,
        taskId: log.task_id
      },
      panelClass: 'log-details-dialog'
    });
  }

  getActionTypeLabel(actionType: string): string {
    const labels: {[key: string]: string} = {
      'GOREV_AC': 'Görev Açma',
      'GOREV_KAPAT': 'Görev Kapatma',
      'UZUN_YOL': 'Uzun Yol',
      'KADEME_GIRIS': 'Kademe Giriş',
      'KADEME_CIKIS': 'Kademe Çıkış'
    };
    
    return labels[actionType] || actionType;
  }
}
