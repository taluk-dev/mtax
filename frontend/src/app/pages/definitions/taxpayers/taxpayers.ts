import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Taxpayer } from '../../../api.service';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-taxpayers',
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
  templateUrl: './taxpayers.html',
  styleUrl: './taxpayers.scss',
})
export class Taxpayers implements OnInit {
  taxpayers = signal<Taxpayer[]>([]);
  isLoading = signal<boolean>(false);

  isEditing = signal<boolean>(false);
  currentTaxpayer = signal<Taxpayer>({ id: 0, full_name: '' });

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.api.getTaxpayers().subscribe({
      next: (data) => {
        this.taxpayers.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading taxpayers', err);
        this.isLoading.set(false);
      }
    });
  }

  startAdd() {
    this.isEditing.set(true);
    this.currentTaxpayer.set({ id: 0, full_name: '' });
  }

  startEdit(tp: Taxpayer) {
    this.isEditing.set(true);
    this.currentTaxpayer.set({ ...tp });
  }

  cancelEdit() {
    this.isEditing.set(false);
  }

  save() {
    const tp = this.currentTaxpayer();
    if (!tp.full_name) return;

    if (tp.id && tp.id > 0) {
      this.api.updateTaxpayer(tp.id, tp).subscribe(() => {
        this.loadData();
        this.cancelEdit();
      });
    } else {
      this.api.addTaxpayer(tp).subscribe(() => {
        this.loadData();
        this.cancelEdit();
      });
    }
  }

  delete(id: number) {
    if (confirm('Bu mükellefi silmek istediğinize emin misiniz?')) {
      this.api.deleteTaxpayer(id).subscribe(() => {
        this.loadData();
      });
    }
  }
}
