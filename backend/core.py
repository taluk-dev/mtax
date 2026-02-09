from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from datetime import date
import sqlite3
import os
from dotenv import load_dotenv

# --- CONFIG ---
load_dotenv()
DB_NAME = "personal_finance.db"
SCHEMA_FILE = "Schema.sql"
DOCS_ROOT = os.getenv("DOCS_ROOT_PATH", "")

class TransactionType:
    INCOME = 1
    EXPENSE = -1

# --- MODELS ---
@dataclass
class PaymentMethod:
    id: int
    method_name: str

@dataclass
class Taxpayer:
    id: int
    full_name: str

@dataclass
class Source:
    id: int
    name: str
    taxpayer_id: int
    share_percentage: float = 1.0
    detail: Optional[str] = None
    default_amount: Optional[float] = None
    type: int = 1 # 1: Income, -1: Expense
    is_net: int = 0 # 0: Gross (Brüt), 1: Net
    deduction_type: int = 0 # 0: General Expense, 1: Special Deduction

@dataclass
class Document:
    id: Optional[int]
    doc_ref: Optional[str]
    display_name: str
    relative_path: str
    created_at: Optional[str] = None
    gdrive_id: Optional[str] = None

    @property
    def full_local_path(self) -> str:
        return os.path.join(DOCS_ROOT, self.relative_path)

@dataclass
class Transaction:
    id: Optional[int]
    taxpayer_id: int
    transaction_date: date
    year: int
    month: Optional[int]
    day: Optional[int]
    type: int 
    source_id: int
    payment_method_id: int
    document_id: Optional[int]
    amount: float
    description: Optional[str] = None
    is_taxable: bool = False
    tax_item_code: Optional[str] = None
    gdrive_id: Optional[str] = None

@dataclass
class TaxSetting:
    year: int
    exemption_amount: float
    declaration_limit: float
    lump_sum_rate: float
    withholding_rate: float
    tax_brackets: str # JSON string
    exemption_limit: float = 0.0

@dataclass
class Declaration:
    id: Optional[int]
    taxpayer_id: int
    year: int
    name: str
    expense_method: str # 'lump_sum', 'actual'
    total_income: float
    exemption_applied: float
    expense_amount: float
    deductions_amount: float
    tax_base: float
    calculated_tax: float
    withholding_tax: float
    net_tax_to_pay: float
    status: str # 'draft', 'final'
    created_at: Optional[str] = None

# --- DATABASE MANAGER ---
class Database:
    def __init__(self, db_name=DB_NAME):
        self.db_name = db_name

    def get_connection(self):
        conn = sqlite3.connect(self.db_name)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        if not os.path.exists(self.db_name):
            with open(SCHEMA_FILE, 'r', encoding='utf-8') as f:
                schema = f.read()
            conn = self.get_connection()
            conn.executescript(schema)
            conn.commit()
            conn.close()

# --- SERVICES ---
class BaseService:
    def __init__(self, db: Database):
        self.db = db

class TaxpayerService(BaseService):
    def get_all(self) -> List[Taxpayer]:
        with self.db.get_connection() as conn:
            rows = conn.execute("SELECT * FROM taxpayers").fetchall()
            return [Taxpayer(**dict(row)) for row in rows]

class SourceService(BaseService):
    def get_all(self) -> List[Source]:
        with self.db.get_connection() as conn:
            rows = conn.execute("SELECT * FROM sources").fetchall()
            return [Source(**dict(row)) for row in rows]
    
    def get_source(self, source_id: int) -> Optional[Source]:
        with self.db.get_connection() as conn:
            row = conn.execute("SELECT * FROM sources WHERE id=?", (source_id,)).fetchone()
            return Source(**dict(row)) if row else None

class PaymentMethodService(BaseService):
    def get_all(self) -> List[PaymentMethod]:
        with self.db.get_connection() as conn:
            rows = conn.execute("SELECT * FROM payment_methods").fetchall()
            return [PaymentMethod(**dict(row)) for row in rows]

class DocumentService(BaseService):
    def add_document(self, d: Document) -> int:
        query = """INSERT INTO documents (doc_ref, display_name, relative_path, gdrive_id)
                   VALUES (?, ?, ?, ?)"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(query, (d.doc_ref, d.display_name, d.relative_path, d.gdrive_id))
            conn.commit()
            return cursor.lastrowid

    def get_all(self) -> List[Document]:
        with self.db.get_connection() as conn:
            rows = conn.execute("SELECT * FROM documents").fetchall()
            return [Document(**dict(row)) for row in rows]

class TransactionService(BaseService):
    def add_transaction(self, t: Transaction):
        query = """INSERT INTO transactions (taxpayer_id, transaction_date, year, month, day, type, source_id, 
                   payment_method_id, document_id, amount, description, is_taxable, tax_item_code, gdrive_id)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"""
        params = (t.taxpayer_id, t.transaction_date, t.year, t.month, t.day, t.type, t.source_id, 
                  t.payment_method_id, t.document_id, t.amount, t.description, t.is_taxable, t.tax_item_code, t.gdrive_id)
        with self.db.get_connection() as conn:
            conn.execute(query, params)
            conn.commit()

    def update_transaction(self, t: Transaction):
        query = """UPDATE transactions SET taxpayer_id=?, transaction_date=?, year=?, month=?, day=?, type=?, 
                   source_id=?, payment_method_id=?, document_id=?, amount=?, description=?, is_taxable=?, 
                   tax_item_code=?, gdrive_id=? WHERE id=?"""
        params = (t.taxpayer_id, t.transaction_date, t.year, t.month, t.day, t.type, t.source_id, 
                  t.payment_method_id, t.document_id, t.amount, t.description, t.is_taxable, t.tax_item_code, t.gdrive_id, t.id)
        with self.db.get_connection() as conn:
            conn.execute(query, params)
            conn.commit()

    def delete_transaction(self, t_id: int):
        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM transactions WHERE id=?", (t_id,))
            conn.commit()

    def get_transaction(self, t_id: int) -> Optional[Transaction]:
        with self.db.get_connection() as conn:
            row = conn.execute("SELECT * FROM transactions WHERE id=?", (t_id,)).fetchone()
            return Transaction(**dict(row)) if row else None

    def get_last_year(self) -> int:
        query = "SELECT MAX(year) as last_year FROM transactions"
        with self.db.get_connection() as conn:
            row = conn.execute(query).fetchone()
            if row and row['last_year']:
                return row['last_year']
        from datetime import datetime
        return datetime.now().year

    def get_years(self) -> List[int]:
        query = "SELECT DISTINCT year FROM transactions ORDER BY year DESC"
        with self.db.get_connection() as conn:
            rows = conn.execute(query).fetchall()
            years = [row['year'] for row in rows]
            if not years:
                from datetime import datetime
                years = [datetime.now().year]
            return years

    def get_transactions(self, year=None, taxpayer_id=None, transaction_type=None, month=None, source_id=None, is_taxable=None) -> List[Dict]:
        query = """SELECT t.*, tp.full_name as taxpayer_name, s.name as source_name, s.deduction_type, pm.method_name,
                          d.doc_ref, d.display_name as doc_name, d.relative_path
                   FROM transactions t
                   LEFT JOIN taxpayers tp ON t.taxpayer_id = tp.id
                   LEFT JOIN sources s ON t.source_id = s.id
                   LEFT JOIN payment_methods pm ON t.payment_method_id = pm.id
                   LEFT JOIN documents d ON t.document_id = d.id
                   WHERE 1=1"""
        params = []
        if year:
            query += " AND t.year = ?"; params.append(year)
        if month:
            query += " AND t.month = ?"; params.append(month)
        if taxpayer_id:
            query += " AND t.taxpayer_id = ?"; params.append(taxpayer_id)
        if transaction_type:
            query += " AND t.type = ?"; params.append(transaction_type)
        if source_id:
            if isinstance(source_id, list):
                placeholders = ','.join(['?' for _ in source_id])
                query += f" AND t.source_id IN ({placeholders})"
                params.extend(source_id)
            else:
                query += " AND t.source_id = ?"
                params.append(source_id)
        if is_taxable is not None:
            query += " AND t.is_taxable = ?"; params.append(1 if is_taxable else 0)
        
        query += " ORDER BY t.transaction_date DESC, t.source_id ASC, t.id DESC"
        with self.db.get_connection() as conn:
            rows = conn.execute(query, params).fetchall()
            return [dict(row) for row in rows]

    def get_summary(self, year=None, taxpayer_id=None, transaction_type=None, month=None, source_id=None, is_taxable=None) -> Dict:
        txs = self.get_transactions(year, taxpayer_id, transaction_type, month, source_id, is_taxable)
        income = sum(t['amount'] for t in txs if t['type'] == TransactionType.INCOME)
        expense = sum(t['amount'] for t in txs if t['type'] == TransactionType.EXPENSE)
        taxable = sum(t['amount'] for t in txs if t['type'] == TransactionType.INCOME and t['is_taxable'])
        return {
            "total_income": income, "total_expense": expense, 
            "taxable_income": taxable, "net_income": income - expense
        }

class TaxSettingService(BaseService):
    def get_settings(self, year: int) -> Optional[TaxSetting]:
        with self.db.get_connection() as conn:
            row = conn.execute("SELECT * FROM tax_settings WHERE year=?", (year,)).fetchone()
            if row:
                return TaxSetting(**dict(row))
            # Fallback defaults for 2025 if not found
            if year == 2025:
                # Default Brackets for 2025 (Simple Example, should be updated)
                # 0-158.000 -> 15%
                # 158.000 - 380.000 -> 20%
                # ... Simplified for planning
                import json
                brackets = [
                    {"limit": 158000, "rate": 0.15},
                    {"limit": 380000, "rate": 0.20},
                    {"limit": 800000, "rate": 0.27},
                    {"limit": 1900000, "rate": 0.35},
                    {"limit": 999999999, "rate": 0.40}
                ]
                return TaxSetting(
                    year=2025,
                    exemption_amount=47000.0,
                    declaration_limit=330000.0,
                    lump_sum_rate=0.15,
                    withholding_rate=0.20,
                    tax_brackets=json.dumps(brackets)
                )
            return None

    def save_settings(self, s: TaxSetting):
        query = """INSERT OR REPLACE INTO tax_settings (year, exemption_amount, declaration_limit, lump_sum_rate, withholding_rate, tax_brackets)
                   VALUES (?, ?, ?, ?, ?, ?)"""
        with self.db.get_connection() as conn:
            conn.execute(query, (s.year, s.exemption_amount, s.declaration_limit, s.lump_sum_rate, s.withholding_rate, s.tax_brackets))
            conn.commit()

class DeclarationService(BaseService):
    def save_declaration(self, d: Declaration):
        query = """INSERT INTO declarations (taxpayer_id, year, name, expense_method, total_income, 
                   exemption_applied, expense_amount, deductions_amount, tax_base, calculated_tax, 
                   withholding_tax, net_tax_to_pay, status)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"""
        params = (d.taxpayer_id, d.year, d.name, d.expense_method, d.total_income, d.exemption_applied,
                  d.expense_amount, d.deductions_amount, d.tax_base, d.calculated_tax, d.withholding_tax,
                  d.net_tax_to_pay, d.status)
        with self.db.get_connection() as conn:
            conn.execute(query, params)
            conn.commit()

    def get_declarations(self, taxpayer_id: int, year: int) -> List[Declaration]:
        with self.db.get_connection() as conn:
            rows = conn.execute("SELECT * FROM declarations WHERE taxpayer_id=? AND year=?", (taxpayer_id, year)).fetchall()
            return [Declaration(**dict(row)) for row in rows]
    
    def calculate_tax_liability(self, tax_base: float, brackets: List[Dict]) -> Tuple[float, List[Dict]]:
        # Calculates progressive tax and returns (total_tax, breakdown)
        tax = 0.0
        previous_limit = 0.0
        remaining_base = tax_base
        breakdown = []

        for b in brackets:
            limit = b['limit']
            rate = b['rate']
            
            taxable_in_bracket = min(remaining_base, limit - previous_limit)
            if taxable_in_bracket <= 0:
                break
            
            bracket_tax = taxable_in_bracket * rate
            tax += bracket_tax
            breakdown.append({
                "rate": rate,
                "base": taxable_in_bracket,
                "tax": bracket_tax
            })
            
            remaining_base -= taxable_in_bracket
            previous_limit = limit
            
            if remaining_base <= 0:
                break
        
        return tax, breakdown

    def calculate(self, taxpayer_id: int, year: int, method: str, other_deductions: List[Dict]) -> Dict:
        # 1. Get Settings
        ts_service = TaxSettingService(self.db)
        settings = ts_service.get_settings(year)
        if not settings:
            raise ValueError(f"Tax settings for {year} not found")

        # 2. Get Transactions
        tx_service = TransactionService(self.db)
        src_service = SourceService(self.db)
        # Fetch all income and expenses for this taxpayer/year
        transactions = tx_service.get_transactions(year=year, taxpayer_id=taxpayer_id)
        
        # 3. Income Calculation (Gross Up)
        total_income = 0.0
        total_withholding = 0.0
        
        # Helper to group by source
        source_incomes = {} # source_id -> amount
        # Also need source details
        sources_map = {s.id: s for s in src_service.get_all()}

        for t in transactions:
            if t['type'] == TransactionType.INCOME:
                source_incomes[t['source_id']] = source_incomes.get(t['source_id'], 0.0) + t['amount']

        for sid, amount in source_incomes.items():
            source = sources_map.get(sid)
            if not source: continue
            
            if source.is_net == 1:
                gross = amount / (1 - settings.withholding_rate)
                withholding = gross - amount
                total_income += gross
                total_withholding += withholding
            else:
                total_income += amount

        # 4. Exemption
        exemption = settings.exemption_amount
        
        # New Rule: If Total Income > Exemption Limit (1.2M for 2025), NO exemption.
        # This applies regardless of expense method.
        if settings.exemption_limit > 0 and total_income > settings.exemption_limit:
            exemption = 0.0

        # Simplified: Apply exemption
        taxable_income_after_exemption = total_income - exemption
        if taxable_income_after_exemption < 0: taxable_income_after_exemption = 0

        # 5. Safi Irat (Expense Deduction)
        total_general_expenses = 0.0
        
        # Find Actual Expenses (Type 0)
        for t in transactions:
            if t['type'] == TransactionType.EXPENSE:
                src = sources_map.get(t['source_id'])
                if src and src.deduction_type == 0:
                    total_general_expenses += t['amount']

        deductible_expense = 0.0
        expense_ratio = 1.0

        if method == 'lump_sum':
            deductible_expense = taxable_income_after_exemption * settings.lump_sum_rate
        elif method == 'actual':
            if total_income > 0:
                expense_ratio = taxable_income_after_exemption / total_income
            else:
                expense_ratio = 0
            deductible_expense = total_general_expenses * expense_ratio

        safi_irat = taxable_income_after_exemption - deductible_expense
        if safi_irat < 0: safi_irat = 0

        # 6. Matrah (Special Deductions)
        total_special_deductions = sum(d['amount'] for d in other_deductions)
        
        # Limit Logic: 10% of Safi Irat
        allowed_special_deduction = min(total_special_deductions, safi_irat * 0.10)
        
        matrah = safi_irat - allowed_special_deduction
        if matrah < 0: matrah = 0

        # 7. Tax Calculation
        import json
        brackets = json.loads(settings.tax_brackets)
        calculated_tax, tax_breakdown = self.calculate_tax_liability(matrah, brackets)
        
        net_tax_to_pay = calculated_tax - total_withholding

        return {
            "total_income": total_income,
            "exemption_applied": exemption,
            "withholding_tax": total_withholding,
            "method": method,
            "total_general_expenses_actual": total_general_expenses,
            "expense_ratio": expense_ratio,
            "deductible_expense": deductible_expense,
            "safi_irat": safi_irat,
            "total_special_deductions": total_special_deductions,
            "allowed_special_deduction": allowed_special_deduction,
            "matrah": matrah,
            "calculated_tax": calculated_tax,
            "tax_breakdown": tax_breakdown,
            "net_tax_to_pay": net_tax_to_pay,
            
            # Aliases for Declaration Interface / DB Saving
            "expense_amount": deductible_expense,
            "expense_method": method,
            "tax_base": matrah,
            "deductions_amount": allowed_special_deduction
        }

    def get_special_deductions_from_db(self, taxpayer_id: int, year: int) -> List[Dict]:
        """Fetches transactions that are marked as Special Deduction (deduction_type=1)"""
        # We need to join transactions with sources to check deduction_type
        query = """
            SELECT s.name, SUM(t.amount) as amount 
            FROM transactions t
            JOIN sources s ON t.source_id = s.id
            WHERE t.taxpayer_id = ? AND t.year = ? AND t.type = -1 AND s.deduction_type = 1
            GROUP BY s.name
        """
        with self.db.get_connection() as conn:
            rows = conn.execute(query, (taxpayer_id, year)).fetchall()
            return [{"name": row['name'], "amount": row['amount']} for row in rows]
