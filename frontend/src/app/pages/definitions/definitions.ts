import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-definitions',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatTabsModule, CommonModule],
  templateUrl: './definitions.html',
  styleUrl: './definitions.scss'
})
export class DefinitionsComponent {
  links = [
    { label: 'Ödeme Yöntemleri', path: 'payment-methods' },
    { label: 'Gelir/Gider Kaynakları', path: 'sources' },
    { label: 'Mükellefler', path: 'taxpayers' },
    { label: 'Vergi Ayarları', path: 'tax-settings' },
  ];
}
