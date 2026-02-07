import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TransactionFormComponent } from './pages/transaction-form/transaction-form.component';

export const routes: Routes = [
    { path: '', component: DashboardComponent },
    { path: 'transaction/new', component: TransactionFormComponent },
    { path: 'transaction/edit/:id', component: TransactionFormComponent },
    { path: 'transaction/duplicate/:id', component: TransactionFormComponent },
    { path: '**', redirectTo: '' }
];
