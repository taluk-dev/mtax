import { Component, Inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { Transaction } from '../../../api.service';

export interface TransactionDialogData {
    transaction: Transaction;
    metadata: any;
    isEdit: boolean;
    isDuplicate: boolean;
}

@Component({
    selector: 'app-transaction-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatDividerModule
    ],
    templateUrl: './transaction-dialog.component.html',
    styleUrl: './transaction-dialog.component.scss'
})
export class TransactionDialogComponent {
    formTx: Transaction;
    metadata: any;
    isEdit: boolean;
    isDuplicate: boolean;

    constructor(
        public dialogRef: MatDialogRef<TransactionDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: TransactionDialogData
    ) {
        this.formTx = { ...data.transaction };
        this.metadata = data.metadata;
        this.isEdit = data.isEdit;
        this.isDuplicate = data.isDuplicate;
    }

    filteredFormSources = computed(() => {
        const type = this.formTx.type;
        const sources = this.metadata.sources;
        return sources.filter((s: any) => s.type === type || s.type === 0);
    });

    onCancel(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        // Validation could be added here
        this.dialogRef.close(this.formTx);
    }
}
