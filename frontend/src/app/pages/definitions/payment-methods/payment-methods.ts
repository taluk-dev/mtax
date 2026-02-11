import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, PaymentMethod } from '../../../api.service';

@Component({
  selector: 'app-payment-methods',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-methods.html',
  styleUrl: './payment-methods.scss',
})
export class PaymentMethods implements OnInit {
  paymentMethods = signal<PaymentMethod[]>([]);
  isLoading = signal<boolean>(false);

  // Form state
  isEditing = signal<boolean>(false);
  currentMethod = signal<PaymentMethod>({ id: 0, method_name: '' });

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.api.getPaymentMethods().subscribe({
      next: (data) => {
        this.paymentMethods.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading payment methods', err);
        this.isLoading.set(false);
      }
    });
  }

  startAdd() {
    this.isEditing.set(true);
    this.currentMethod.set({ id: 0, method_name: '' });
  }

  startEdit(pm: PaymentMethod) {
    this.isEditing.set(true);
    this.currentMethod.set({ ...pm });
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.currentMethod.set({ id: 0, method_name: '' });
  }

  save() {
    const method = this.currentMethod();
    if (!method.method_name) return;

    if (method.id && method.id > 0) {
      this.api.updatePaymentMethod(method.id, method).subscribe(() => {
        this.loadData();
        this.cancelEdit();
      });
    } else {
      this.api.addPaymentMethod(method).subscribe(() => {
        this.loadData();
        this.cancelEdit();
      });
    }
  }

  delete(id: number) {
    if (confirm('Bu ödeme yöntemini silmek istediğinize emin misiniz?')) {
      this.api.deletePaymentMethod(id).subscribe(() => {
        this.loadData();
      });
    }
  }
}
