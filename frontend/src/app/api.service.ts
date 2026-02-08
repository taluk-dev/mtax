import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Taxpayer {
    id: number;
    full_name: string;
}

export interface Source {
    id: number;
    name: string;
    taxpayer_id: number;
    type: number;
}

export interface PaymentMethod {
    id: number;
    method_name: string;
}

export interface Transaction {
    id?: number;
    taxpayer_id: number;
    transaction_date: string;
    year: number;
    month?: number;
    day?: number;
    type: number;
    source_id?: number;
    payment_method_id: number;
    amount: number;
    description?: string;
    document_id?: number;
    is_taxable: boolean;
    tax_item_code?: string;
    taxpayer_name?: string;
    source_name?: string;
    method_name?: string;
    gdrive_id?: string;
}

export interface Summary {
    total_income: number;
    total_expense: number;
    taxable_income: number;
    net_income: number;
}

export interface DashboardData {
    transactions: Transaction[];
    summary: Summary;
}

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private apiUrl = 'http://127.0.0.1:8000';

    constructor(private http: HttpClient) { }

    getMetadata(): Observable<any> {
        return this.http.get(`${this.apiUrl}/metadata`);
    }

    getDashboard(params: any): Observable<DashboardData> {
        return this.http.get<DashboardData>(`${this.apiUrl}/transactions`, { params });
    }

    getTransaction(id: number): Observable<Transaction> {
        return this.http.get<Transaction>(`${this.apiUrl}/transactions/${id}`);
    }

    addTransaction(tx: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/transactions`, tx);
    }

    updateTransaction(id: number, tx: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/transactions/${id}`, tx);
    }

    deleteTransaction(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/transactions/${id}`);
    }

    addDocument(doc: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/documents`, doc);
    }
}
