import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, TaxSetting } from '../../../api.service';

@Component({
  selector: 'app-tax-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tax-settings.html',
  styleUrl: './tax-settings.scss',
})
export class TaxSettings implements OnInit {
  years = signal<number[]>([]);
  isLoading = signal<boolean>(false);

  // Form state
  selectedYear = signal<number | null>(null);
  currentSettings = signal<TaxSetting>({
    year: new Date().getFullYear(),
    exemption_amount: 0,
    declaration_limit: 0,
    lump_sum_rate: 0,
    withholding_rate: 0,
    tax_brackets: '[]'
  });

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadYears();
  }

  loadYears() {
    this.api.getMetadata().subscribe(data => {
      // data.years contains available years for transactions, but settings might exist for others?
      // For now, let's use that + allow adding new.
      // Or we should ideally have getTaxSettingsYears endpoint.
      // Let's rely on metadata years for now and maybe distinct tax_settings years if I added that endpoint.
      // But I didn't. So let's use metadata years.
      this.years.set(data.years || [new Date().getFullYear()]);
    });
  }

  selectYear(year: number) {
    this.selectedYear.set(year);
    this.isLoading.set(true);
    this.api.getTaxSettings(year).subscribe({
      next: (data) => {
        if (data && data.year) {
          this.currentSettings.set(data);
        } else {
          // Defaults if not found
          this.currentSettings.set({
            year: year,
            exemption_amount: 0,
            declaration_limit: 0,
            lump_sum_rate: 0.15, // Default common
            withholding_rate: 0.20, // Default common
            tax_brackets: '[]'
          });
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching settings', err);
        this.isLoading.set(false);
      }
    });
  }

  addNewYear() {
    const yearStr = prompt("Hangi yıl için ayar eklemek istiyorsunuz?", (new Date().getFullYear() + 1).toString());
    if (yearStr) {
      const year = parseInt(yearStr, 10);
      if (!isNaN(year)) {
        if (!this.years().includes(year)) {
          this.years.update(y => [year, ...y].sort((a, b) => b - a));
        }
        this.selectYear(year);
      }
    }
  }

  save() {
    const s = this.currentSettings();
    this.api.saveTaxSettings(s).subscribe(() => {
      alert("Ayarlar kaydedildi.");
      this.loadYears(); // Refresh lists if needed
    });
  }
}
