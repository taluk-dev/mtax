import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TransactionFormComponent } from './pages/transaction-form/transaction-form.component';

export const routes: Routes = [
    { path: '', component: DashboardComponent },
    { path: 'transaction/new', component: TransactionFormComponent },
    { path: 'transaction/edit/:id', component: TransactionFormComponent },
    { path: 'transaction/duplicate/:id', component: TransactionFormComponent },
    { path: 'declaration', loadComponent: () => import('./pages/declaration/declaration.component').then(m => m.DeclarationComponent) },
    { path: 'transaction/duplicate/:id', component: TransactionFormComponent },
    { path: 'declaration', loadComponent: () => import('./pages/declaration/declaration.component').then(m => m.DeclarationComponent) },
    {
        path: 'definitions',
        loadComponent: () => import('./pages/definitions/definitions').then(m => m.DefinitionsComponent),
        children: [
            { path: 'payment-methods', loadComponent: () => import('./pages/definitions/payment-methods/payment-methods').then(m => m.PaymentMethods) },
            { path: 'sources', loadComponent: () => import('./pages/definitions/sources/sources').then(m => m.Sources) },
            { path: 'taxpayers', loadComponent: () => import('./pages/definitions/taxpayers/taxpayers').then(m => m.Taxpayers) },
            { path: 'tax-settings', loadComponent: () => import('./pages/definitions/tax-settings/tax-settings').then(m => m.TaxSettings) },
            { path: '', redirectTo: 'payment-methods', pathMatch: 'full' }
        ]
    },
    { path: '**', redirectTo: '' }
];
