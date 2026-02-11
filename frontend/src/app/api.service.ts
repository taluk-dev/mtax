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
    is_net: number;
    share_percentage?: number;
    detail?: string;
    default_amount?: number;
    deduction_type?: number;
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

export interface TaxSetting {
    year: number;
    exemption_amount: number;
    declaration_limit: number;
    lump_sum_rate: number;
    withholding_rate: number;
    tax_brackets: string;
}

export interface SpecialDeduction {
    name: string;
    amount: number;
}

export interface CalculateRequest {
    taxpayer_id: number;
    year: number;
    method: string;
    other_deductions: SpecialDeduction[];
}

export interface Declaration {
    id?: number;
    taxpayer_id: number;
    year: number;
    name: string;
    expense_method: string;
    total_income: number;
    exemption_applied: number;
    expense_amount: number;
    deductions_amount: number;
    tax_base: number;
    calculated_tax: number;
    withholding_tax: number;
    net_tax_to_pay: number;
    status: string;
    created_at?: string;

    // UI Helpers (Optional)
    expense_ratio?: number;
    safi_irat?: number;
    allowed_special_deduction?: number;
    total_general_expenses_actual?: number;
    total_special_deductions?: number;
    tax_breakdown?: { rate: number, base: number, tax: number }[];
    matrah?: number;
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



    // --- Taxpayers ---
    getTaxpayers(): Observable<Taxpayer[]> {
        return this.http.get<Taxpayer[]>(`${this.apiUrl}/taxpayers`);
    }

    addTaxpayer(tp: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/taxpayers`, tp);
    }

    updateTaxpayer(id: number, tp: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/taxpayers/${id}`, tp);
    }

    deleteTaxpayer(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/taxpayers/${id}`);
    }

    // --- Sources ---
    getSources(): Observable<Source[]> {
        return this.http.get<Source[]>(`${this.apiUrl}/sources`);
    }

    addSource(src: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/sources`, src);
    }

    updateSource(id: number, src: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/sources/${id}`, src);
    }

    deleteSource(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/sources/${id}`);
    }

    // --- Payment Methods ---
    getPaymentMethods(): Observable<PaymentMethod[]> {
        return this.http.get<PaymentMethod[]>(`${this.apiUrl}/payment-methods`);
    }

    addPaymentMethod(pm: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/payment-methods`, pm);
    }

    updatePaymentMethod(id: number, pm: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/payment-methods/${id}`, pm);
    }

    deletePaymentMethod(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/payment-methods/${id}`);
    }

    // --- Tax Settings ---
    getTaxSettings(year: number): Observable<TaxSetting> {
        return this.http.get<TaxSetting>(`${this.apiUrl}/tax-settings/${year}`);
    }

    saveTaxSettings(settings: TaxSetting): Observable<any> {
        return this.http.post(`${this.apiUrl}/tax-settings`, settings);
    }

    // --- Declarations ---
    calculateDeclaration(req: CalculateRequest): Observable<Declaration> {
        return this.http.post<Declaration>(`${this.apiUrl}/declarations/calculate`, req);
    }

    saveDeclaration(dec: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/declarations`, dec);
    }

    getSpecialDeductions(taxpayerId: number, year: number): Observable<SpecialDeduction[]> {
        return this.http.get<SpecialDeduction[]>(`${this.apiUrl}/declarations/special-deductions/${taxpayerId}/${year}`);
    }

    getDeclarations(taxpayerId: number, year: number): Observable<Declaration[]> {
        return this.http.get<Declaration[]>(`${this.apiUrl}/declarations/list/${taxpayerId}/${year}`);
    }
}
