import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, TaxItem } from '../../../api.service';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-tax-items',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatTableModule,
        MatFormFieldModule,
        MatTooltipModule
    ],
    templateUrl: './tax-items.html',
    styleUrl: './tax-items.scss',
})
export class TaxItems implements OnInit {
    taxItems = signal<TaxItem[]>([]);
    isLoading = signal<boolean>(false);

    isEditing = signal<boolean>(false);
    currentItem = signal<TaxItem>({ id: 0, code: '', name: '' });

    constructor(private api: ApiService) { }

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        this.api.getTaxItems().subscribe({
            next: (data) => {
                this.taxItems.set(data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading tax items', err);
                this.isLoading.set(false);
            }
        });
    }

    startAdd() {
        this.isEditing.set(true);
        this.currentItem.set({ id: 0, code: '', name: '' });
    }

    startEdit(item: TaxItem) {
        this.isEditing.set(true);
        this.currentItem.set({ ...item });
    }

    cancelEdit() {
        this.isEditing.set(false);
    }

    save() {
        const item = this.currentItem();
        if (!item.code || !item.name) return;

        if (item.id && item.id > 0) {
            this.api.updateTaxItem(item.id, item).subscribe(() => {
                this.loadData();
                this.cancelEdit();
            });
        } else {
            this.api.addTaxItem(item).subscribe(() => {
                this.loadData();
                this.cancelEdit();
            });
        }
    }

    delete(id: number) {
        if (confirm('Bu vergi kalemini silmek istediğinize emin misiniz?')) {
            this.api.deleteTaxItem(id).subscribe(() => {
                this.loadData();
            });
        }
    }
}
