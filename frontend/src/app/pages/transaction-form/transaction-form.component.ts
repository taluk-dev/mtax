import { Component, OnInit, signal, computed } from '@angular/core';
import { ErrorStateMatcher } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService, Transaction } from '../../api.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-transaction-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatSnackBarModule,
        MatTooltipModule
    ],
    templateUrl: './transaction-form.component.html',
    styleUrl: './transaction-form.component.scss'
})
export class TransactionFormComponent implements OnInit {
    loading = signal(false);
    metadata = signal<any>({ taxpayers: [], sources: [], payment_methods: [] });

    formTx: Transaction = this.initForm();
    isEdit = false;
    isDuplicate = false;
    txId: number | null = null;
    amountProxy = ''; // Proxy for Turkish localized input (e.g., "1.250,50")
    amountError = signal<string | null>(null);

    // Material'ın hata durumunu manuel tetiklemek için matcher
    amountMatcher: ErrorStateMatcher = {
        isErrorState: () => !!this.amountError()
    };

    constructor(
        private api: ApiService,
        private snackBar: MatSnackBar,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        this.api.getMetadata().subscribe(meta => {
            this.metadata.set(meta);
            this.checkMode();
        });
    }

    private checkMode() {
        const id = this.route.snapshot.paramMap.get('id');
        const url = this.router.url;

        if (id) {
            this.txId = +id;
            this.isEdit = url.includes('/edit/');
            this.isDuplicate = url.includes('/duplicate/');

            this.loading.set(true);
            this.api.getTransaction(this.txId).subscribe({
                next: (tx) => {
                    this.formTx = { ...tx };
                    this.syncAmountToProxy();
                    if (this.isDuplicate) {
                        delete this.formTx.id;
                        this.txId = null;
                    }
                    this.loading.set(false);
                },
                error: () => {
                    this.snackBar.open('Kayıt yüklenemedi!', 'Kapat', { duration: 3000 });
                    this.router.navigate(['/']);
                }
            });
        }
    }

    initForm(): Transaction {
        const now = new Date();
        this.amountProxy = '';
        return {
            taxpayer_id: 0,
            transaction_date: now.toISOString().split('T')[0],
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate(),
            type: 1, // Default to Income
            source_id: 1,
            payment_method_id: 1,
            amount: 0,
            description: '',
            is_taxable: true,
            tax_item_code: ''
        };
    }

    filteredFormSources() {
        const type = this.formTx.type;
        const sources = this.metadata().sources || [];
        return sources.filter((s: any) => s.type === type || s.type === 0);
    }

    save() {
        if (this.amountError()) {
            this.snackBar.open('Lütfen formdaki hataları düzeltin.', 'Kapat', { duration: 3000 });
            return;
        }

        // Sync full date string
        this.formTx.transaction_date = `${this.formTx.year}-${String(this.formTx.month).padStart(2, '0')}-${String(this.formTx.day).padStart(2, '0')}`;

        this.loading.set(true);
        const obs = (this.isEdit && this.txId)
            ? this.api.updateTransaction(this.txId, this.formTx)
            : this.api.addTransaction(this.formTx);

        obs.subscribe({
            next: () => {
                this.snackBar.open(this.isEdit ? 'Kayıt güncellendi.' : 'İşlem başarıyla kaydedildi.', 'Tamam', { duration: 3000 });
                this.router.navigate(['/']);
            },
            error: () => {
                this.snackBar.open('Hata oluştu!', 'Kapat', { duration: 3000 });
                this.loading.set(false);
            }
        });
    }

    cancel() {
        this.router.navigate(['/']);
    }

    // --- Localized Amount Helpers ---
    syncAmountToProxy() {
        if (this.formTx.amount === 0) {
            this.amountProxy = '';
        } else {
            this.amountProxy = this.formTx.amount.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                useGrouping: false
            });
        }
    }

    updateAmount(value: string) {
        this.amountProxy = value;
        this.amountError.set(null); // Clear error on typing

        if (!value) {
            this.formTx.amount = 0;
            return;
        }

        // Sessizce arka planda sayıyı güncelle (sadece virgül-nokta dönüşümü)
        const clean = value.replace(',', '.');
        const num = parseFloat(clean);
        this.formTx.amount = isNaN(num) ? 0 : num;
    }

    formatAmountOnBlur() {
        const value = this.amountProxy;
        if (!value) return;

        // Validasyon: Nokta kullanımı tamamen yasak
        if (value.includes('.')) {
            this.amountError.set('Sadece ondalık ayraç için virgül kullanınız. Örnek: 1000000,25');
            return;
        }

        // Validasyon: Birden fazla virgül yasak
        const commaCount = (value.match(/,/g) || []).length;
        if (commaCount > 1) {
            this.amountError.set('Birden fazla virgül kullanamazsınız.');
            return;
        }

        this.amountError.set(null);
        this.syncAmountToProxy();
    }
}
