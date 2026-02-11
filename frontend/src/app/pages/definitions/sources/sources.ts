import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Source, Taxpayer } from '../../../api.service';

@Component({
  selector: 'app-sources',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sources.html',
  styleUrl: './sources.scss',
})
export class Sources implements OnInit {
  sources = signal<Source[]>([]);
  taxpayers = signal<Taxpayer[]>([]);
  isLoading = signal<boolean>(false);

  // Form state
  isEditing = signal<boolean>(false);
  currentSource = signal<Source>({
    id: 0,
    name: '',
    taxpayer_id: 0,
    share_percentage: 1.0,
    type: 1, // Income default
    is_net: 0,
    deduction_type: 0
  });

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadData();
    this.loadTaxpayers();
  }

  loadData() {
    this.isLoading.set(true);
    this.api.getSources().subscribe({
      next: (data) => {
        this.sources.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading sources', err);
        this.isLoading.set(false);
      }
    });
  }

  loadTaxpayers() {
    this.api.getTaxpayers().subscribe(data => {
      this.taxpayers.set(data);
    });
  }

  startAdd() {
    this.isEditing.set(true);
    this.currentSource.set({
      id: 0,
      name: '',
      taxpayer_id: this.taxpayers().length > 0 ? this.taxpayers()[0].id : 0,
      share_percentage: 1.0,
      type: 1,
      is_net: 0,
      deduction_type: 0,
      detail: '',
      default_amount: 0
    });
  }

  startEdit(src: Source) {
    this.isEditing.set(true);
    this.currentSource.set({ ...src });
  }

  cancelEdit() {
    this.isEditing.set(false);
  }

  save() {
    const src = this.currentSource();
    if (!src.name) return;

    if (src.id && src.id > 0) {
      this.api.updateSource(src.id, src).subscribe(() => {
        this.loadData();
        this.cancelEdit();
      });
    } else {
      this.api.addSource(src).subscribe(() => {
        this.loadData();
        this.cancelEdit();
      });
    }
  }

  delete(id: number) {
    if (confirm('Bu kaynağı silmek istediğinize emin misiniz?')) {
      this.api.deleteSource(id).subscribe(() => {
        this.loadData();
      });
    }
  }

  getTaxpayerName(id: number): string {
    const tp = this.taxpayers().find(t => t.id === id);
    return tp ? tp.full_name : 'Bilinmeyen';
  }
}
