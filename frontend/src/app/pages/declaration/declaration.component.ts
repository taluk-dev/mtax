import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService, TaxSetting, Declaration, SpecialDeduction } from '../../api.service';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-declaration',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        MatCardModule,
        MatButtonModule,
        MatInputModule,
        MatSelectModule,
        MatRadioModule,
        MatIconModule,
        MatTableModule,
        MatListModule,
        MatProgressSpinnerModule,
        MatDividerModule,
        MatTooltipModule
    ],
    templateUrl: './declaration.component.html',
    styleUrls: ['./declaration.component.scss']
})
export class DeclarationComponent implements OnInit {
    loading = signal(false);
    taxpayers = signal<any[]>([]);
    years = signal<number[]>([]);

    selectedTaxpayerId = signal<number | null>(null);
    selectedYear = signal<number | null>(null);

    // State
    taxSettings = signal<TaxSetting | null>(null);
    declarations = signal<Declaration[]>([]);

    // Form
    form: FormGroup;

    // Calculation Result
    result = signal<Declaration | null>(null);

    constructor(
        private api: ApiService,
        private fb: FormBuilder,
        private snackBar: MatSnackBar,
        private router: Router
    ) {
        this.form = this.fb.group({
            method: ['lump_sum', Validators.required],
            specialDeductions: this.fb.array([]),
            declarationName: ['Draft 1']
        });

        // Effect to reload declarations when selection changes
        effect(() => {
            const tp = this.selectedTaxpayerId();
            const y = this.selectedYear();
            if (tp && y) {
                this.loadDeclarations(tp, y);
                this.loadSettings(y);
            } else {
                this.declarations.set([]);
                this.taxSettings.set(null);
                this.result.set(null);
            }
        }, { allowSignalWrites: true });
    }

    ngOnInit() {
        this.api.getMetadata().subscribe(meta => {
            this.taxpayers.set(meta.taxpayers);
            this.years.set(meta.years);
            // Default selections if available
            if (meta.years.length > 0) this.selectedYear.set(meta.years[0]);
            if (meta.taxpayers.length > 0) this.selectedTaxpayerId.set(meta.taxpayers[0].id);
        });

        // Add one default deduction row
        this.addDeduction();
    }

    get specialDeductions() {
        return this.form.get('specialDeductions') as FormArray;
    }

    addDeduction(name: string = 'Sağlık/Eğitim', amount: number = 0) {
        const group = this.fb.group({
            name: [name, Validators.required],
            amount: [amount, [Validators.required, Validators.min(0)]]
        });
        this.specialDeductions.push(group);
    }

    removeDeduction(index: number) {
        this.specialDeductions.removeAt(index);
    }

    loadSettings(year: number) {
        this.api.getTaxSettings(year).subscribe(settings => {
            if (!settings || Object.keys(settings).length === 0) {
                this.snackBar.open(`${year} yılı için vergi ayarları bulunamadı! Varsayılanlar kullanılacak.`, 'Tamam', { duration: 5000 });
            }
            this.taxSettings.set(settings);
        });
    }

    loadDeclarations(tp: number, year: number) {
        this.loading.set(true);
        // 1. Get History
        this.api.getDeclarations(tp, year).subscribe({
            next: (data) => {
                this.declarations.set(data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });

        // 2. Get Auto-Fetched Deductions (Suggestions)
        this.specialDeductions.clear(); // Reset form array
        this.api.getSpecialDeductions(tp, year).subscribe(suggestions => {
            if (suggestions.length > 0) {
                suggestions.forEach(s => {
                    this.addDeduction(s.name, s.amount);
                });
                this.snackBar.open(`${suggestions.length} adet özel indirim Veritabanından getirildi.`, 'Tamam', { duration: 3000 });
            } else {
                // If no suggestions, add one empty row
                this.addDeduction();
            }
        });
    }

    calculate() {
        if (!this.selectedTaxpayerId() || !this.selectedYear()) return;
        if (this.form.invalid) return;

        this.loading.set(true);
        const req = {
            taxpayer_id: this.selectedTaxpayerId()!,
            year: this.selectedYear()!,
            method: this.form.get('method')?.value,
            other_deductions: this.specialDeductions.value
        };

        this.api.calculateDeclaration(req).subscribe({
            next: (res) => {
                this.result.set(res);
                this.loading.set(false);
            },
            error: (err) => {
                this.snackBar.open('Hesaplama hatası: ' + err.error.detail, 'Kapat');
                this.loading.set(false);
            }
        });
    }

    save(status: 'draft' | 'final') {
        const res = this.result();
        if (!res) return;

        const dec = {
            ...res,
            name: this.form.get('declarationName')?.value || 'Taslak',
            status: status
        };

        this.api.saveDeclaration(dec).subscribe(() => {
            this.snackBar.open('Beyanname kaydedildi!', 'Tamam', { duration: 3000 });
            this.loadDeclarations(this.selectedTaxpayerId()!, this.selectedYear()!);
        });
    }

    viewDeclaration(dec: Declaration) {
        // Load saved declaration into view
        this.result.set(dec);
        this.form.patchValue({
            method: dec.expense_method,
            declarationName: dec.name
        });
        // Note: We can't easily restore the dynamic deduction rows from just the sum 'deductions_amount' 
        // without storing the breakdown. For now, we just show the result.
        // If needed, we can update backend to store the JSON of deductions.
        this.snackBar.open('Kayıtlı beyanname yüklendi.', 'Tamam', { duration: 2000 });
    }
}
