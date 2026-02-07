import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Transaction, Summary } from './api.service';

// Angular Material Imports
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSidenavModule,
    MatToolbarModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatDividerModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class App implements OnInit {
  // Signals for state management (Better for Zoneless Angular)
  loading = signal(false);
  showForm = signal(false);
  editingTx: number | null = null;
  isDuplicate = false;

  transactions = signal<Transaction[]>([]);
  summary = signal<Summary>({ total_income: 0, total_expense: 0, taxable_income: 0, net_income: 0 });

  metadata = signal<{
    taxpayers: any[],
    sources: any[],
    payment_methods: any[]
  }>({
    taxpayers: [],
    sources: [],
    payment_methods: []
  });

  filters = signal({
    year: 2026,
    month: 'all' as number | null | 'all',
    taxpayer_id: 'all' as number | null | 'all',
    type: 'all' as number | null | 'all',
    source_id: [] as number[],
    is_taxable: 'all' as boolean | null | 'all'
  });

  formTx: Transaction = this.initForm();

  // Dynamic Source Filtering
  filteredFilterSources = computed(() => {
    const type = this.filters().type;
    const sources = this.metadata().sources;
    if (!type || type === 'all') return sources;
    return sources.filter(s => s.type === type || s.type === 0);
  });

  filteredFormSources = computed(() => {
    const type = this.formTx.type;
    const sources = this.metadata().sources;
    return sources.filter(s => s.type === type || s.type === 0);
  });

  displayedColumns: string[] = ['date', 'taxpayer', 'description', 'is_taxable', 'amount', 'actions'];

  years = [2026, 2025, 2024, 2023, 2022];
  months = [
    { name: 'Ocak', code: 1 }, { name: 'Şubat', code: 2 }, { name: 'Mart', code: 3 },
    { name: 'Nisan', code: 4 }, { name: 'Mayıs', code: 5 }, { name: 'Haziran', code: 6 },
    { name: 'Temmuz', code: 7 }, { name: 'Ağustos', code: 8 }, { name: 'Eylül', code: 9 },
    { name: 'Ekim', code: 10 }, { name: 'Kasım', code: 11 }, { name: 'Aralık', code: 12 }
  ];

  constructor(private api: ApiService, private snackBar: MatSnackBar) { }

  initForm(): Transaction {
    const now = new Date();
    return {
      taxpayer_id: 0,
      transaction_date: now.toISOString().split('T')[0],
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      type: -1,
      source_id: 1,
      payment_method_id: 1,
      amount: 0,
      description: '',
      is_taxable: true
    };
  }

  ngOnInit() {
    this.api.getMetadata().subscribe(meta => {
      this.metadata.set(meta);
      // Default to all sources selected
      if (meta.sources && meta.sources.length > 0) {
        this.updateFilter('source_id', meta.sources.map((s: any) => s.id));
      }
    });
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    const currentFilters = this.filters();
    const params: any = { year: currentFilters.year };
    if (currentFilters.taxpayer_id !== 'all' && currentFilters.taxpayer_id !== null) params.taxpayer_id = currentFilters.taxpayer_id;
    if (currentFilters.type !== 'all' && currentFilters.type !== null) params.type = currentFilters.type;
    if (currentFilters.month !== 'all' && currentFilters.month !== null) params.month = currentFilters.month;
    if (currentFilters.source_id && currentFilters.source_id.length > 0) params.source_id = currentFilters.source_id;
    if (currentFilters.is_taxable !== 'all' && currentFilters.is_taxable !== null) params.is_taxable = currentFilters.is_taxable;

    this.api.getDashboard(params).subscribe({
      next: (data) => {
        this.transactions.set(data.transactions);
        this.summary.set(data.summary);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Veri yükleme hatası!', 'Kapat', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  updateFilter(key: string, value: any) {
    this.filters.update(prev => ({ ...prev, [key]: value }));
  }

  selectAllSources() {
    const allIds = this.filteredFilterSources().map(s => s.id);
    this.updateFilter('source_id', allIds);
  }

  getSelectedValues(list: any): number[] {
    return list.selectedOptions.selected.map((option: any) => option.value);
  }

  openAdd() {
    this.editingTx = null;
    this.isDuplicate = false;
    this.formTx = this.initForm();
    this.showForm.set(true);
  }

  duplicateTx(tx: Transaction) {
    this.editingTx = null;
    this.isDuplicate = true;
    this.formTx = { ...tx };
    delete this.formTx.id;
    // Keep current date or keep tx date? Usually for institutional finance, copying means same details but maybe new date.
    // However, often it's the SAME date for splitting transctions. Let's keep existing date.
    this.showForm.set(true);
  }

  openEdit(tx: Transaction) {
    this.editingTx = tx.id!;
    this.isDuplicate = false;
    this.formTx = { ...tx };
    this.showForm.set(true);
  }

  saveTx() {
    this.formTx.transaction_date = `${this.formTx.year}-${String(this.formTx.month).padStart(2, '0')}-${String(this.formTx.day).padStart(2, '0')}`;

    if (this.editingTx) {
      this.api.updateTransaction(this.editingTx, this.formTx).subscribe(() => {
        this.snackBar.open('Kayıt güncellendi!', 'Tamam', { duration: 2000 });
        this.showForm.set(false);
        this.loadData();
      });
    } else {
      this.api.addTransaction(this.formTx).subscribe(() => {
        this.snackBar.open('Yeni kayıt eklendi!', 'Tamam', { duration: 2000 });
        this.showForm.set(false);
        this.loadData();
      });
    }
  }

  deleteTx(id: number | undefined) {
    if (!id || !confirm('Silmek istediğinize emin misiniz?')) return;
    this.api.deleteTransaction(id).subscribe(() => {
      this.snackBar.open('Kayıt silindi!', 'Tamam', { duration: 2000 });
      this.loadData();
    });
  }
}
