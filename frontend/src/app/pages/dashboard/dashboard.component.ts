import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService, Transaction, Summary } from '../../api.service';

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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';


@Component({
    selector: 'app-dashboard',
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
        MatDividerModule,
        MatTooltipModule,
        MatMenuModule,
        RouterModule
    ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
    loading = signal(false);

    transactions = signal<Transaction[]>([]);
    summary = signal<Summary>({ total_income: 0, total_expense: 0, taxable_income: 0, net_income: 0 });

    metadata = signal<{
        taxpayers: any[],
        sources: any[],
        payment_methods: any[],
        last_year: number,
        years: number[]
    }>({
        taxpayers: [],
        sources: [],
        payment_methods: [],
        last_year: new Date().getFullYear(),
        years: []
    });

    filters = signal({
        year: 'all' as number | null | 'all',
        month: 'all' as number | null | 'all',
        taxpayer_id: 'all' as number | null | 'all',
        type: 'all' as number | null | 'all',
        source_id: [] as number[],
        is_taxable: 'all' as boolean | null | 'all'
    });

    searchTerm = signal('');



    // Dynamic Source Filtering
    filteredFilterSources = computed(() => {
        const type = this.filters().type;
        const sources = this.metadata().sources;
        if (!type || type === 'all') return sources;
        return sources.filter(s => s.type === type || s.type === 0);
    });



    filteredTransactions = computed(() => {
        const term = this.searchTerm().toLowerCase();
        const txs = [...this.transactions()].sort((a, b) => {
            const dateA = new Date(a.transaction_date).getTime();
            const dateB = new Date(b.transaction_date).getTime();
            if (dateB !== dateA) return dateB - dateA;

            // İkincil sıralama: Source ID ASC
            return (a.source_id || 0) - (b.source_id || 0);
        });

        if (!term) return txs;
        return txs.filter(tx =>
            tx.description?.toLowerCase().includes(term) ||
            tx.taxpayer_name?.toLowerCase().includes(term) ||
            tx.source_name?.toLowerCase().includes(term) ||
            tx.amount.toString().includes(term)
        );
    });

    filteredTotalAmount = computed(() => {
        return this.filteredTransactions().reduce((acc, tx) => {
            return acc + (tx.type === 1 ? tx.amount : -tx.amount);
        }, 0);
    });

    displayedColumns: string[] = ['id', 'date', 'taxpayer', 'source', 'type', 'is_taxable', 'amount', 'actions'];

    months = [
        { name: 'Ocak', code: 1 }, { name: 'Şubat', code: 2 }, { name: 'Mart', code: 3 },
        { name: 'Nisan', code: 4 }, { name: 'Mayıs', code: 5 }, { name: 'Haziran', code: 6 },
        { name: 'Temmuz', code: 7 }, { name: 'Ağustos', code: 8 }, { name: 'Eylül', code: 9 },
        { name: 'Ekim', code: 10 }, { name: 'Kasım', code: 11 }, { name: 'Aralık', code: 12 }
    ];

    constructor(
        private api: ApiService,
        private snackBar: MatSnackBar,
        private router: Router
    ) {
        // Automatically load data whenever filters change
        effect(() => {
            this.filters();
            this.loadData();
        }, { allowSignalWrites: true });
    }

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
            this.filters.update(f => ({
                ...f,
                source_id: meta.sources.map((s: any) => s.id)
            }));
            // loadData is handled by effect
        });
    }

    loadData() {
        this.loading.set(true);
        const currentFilters = this.filters();
        const params: any = {};
        if (currentFilters.year !== 'all' && currentFilters.year !== null) params.year = currentFilters.year;
        if (currentFilters.taxpayer_id !== 'all' && currentFilters.taxpayer_id !== null) params.taxpayer_id = currentFilters.taxpayer_id;
        if (currentFilters.type !== 'all' && currentFilters.type !== null) params.type = currentFilters.type;
        if (currentFilters.month !== 'all' && currentFilters.month !== null) params.month = currentFilters.month;
        if (this.isFilterActive('source_id')) {
            params.source_id = currentFilters.source_id;
        }
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

    toggleSourceFilter(sourceId: number) {
        this.filters.update(prev => {
            const current = [...prev.source_id];
            const index = current.indexOf(sourceId);
            if (index > -1) {
                current.splice(index, 1);
            } else {
                current.push(sourceId);
            }
            return { ...prev, source_id: current };
        });
    }

    isFilterActive(key: string): boolean {
        const f = this.filters();
        if (key === 'month') return f.month !== 'all';
        if (key === 'year') return f.year !== 'all';
        if (key === 'taxpayer_id') return f.taxpayer_id !== 'all';
        if (key === 'type') return f.type !== 'all';
        if (key === 'is_taxable') return f.is_taxable !== 'all';
        if (key === 'source_id') return f.source_id.length !== this.metadata().sources.length;
        return false;
    }

    resetFilter(key: string, event: Event) {
        if (this.isFilterActive(key)) {
            event.stopPropagation();
            if (key === 'month') this.updateFilter('month', 'all');
            else if (key === 'year') this.updateFilter('year', 'all');
            else if (key === 'taxpayer_id') this.updateFilter('taxpayer_id', 'all');
            else if (key === 'type') this.updateFilter('type', 'all');
            else if (key === 'is_taxable') this.updateFilter('is_taxable', 'all');
            else if (key === 'source_id') {
                this.updateFilter('source_id', this.metadata().sources.map(s => s.id));
            }
        }
    }

    openAdd() {
        this.router.navigate(['/transaction/new']);
    }

    duplicateTx(tx: Transaction) {
        this.router.navigate(['/transaction/duplicate', tx.id]);
    }

    openEdit(tx: Transaction) {
        this.router.navigate(['/transaction/edit', tx.id]);
    }

    saveTx(tx: Transaction, id?: number) {
        tx.transaction_date = `${tx.year}-${String(tx.month).padStart(2, '0')}-${String(tx.day).padStart(2, '0')}`;

        if (id) {
            this.api.updateTransaction(id, tx).subscribe(() => {
                this.snackBar.open('Kayıt güncellendi!', 'Tamam', { duration: 2000 });
                this.loadData();
            });
        } else {
            this.api.addTransaction(tx).subscribe(() => {
                this.snackBar.open('Yeni kayıt eklendi!', 'Tamam', { duration: 2000 });
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
