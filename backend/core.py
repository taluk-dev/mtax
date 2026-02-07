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

@dataclass
class Document:
    id: Optional[int]
    doc_ref: Optional[str]
    display_name: str
    relative_path: str
    gdrive_id: Optional[str] = None
    created_at: Optional[str] = None

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
    source_id: Optional[int]
    payment_method_id: int
    document_id: Optional[int]
    amount: float
    description: Optional[str] = None
    is_taxable: bool = False
    tax_item_code: Optional[str] = None

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
                   payment_method_id, document_id, amount, description, is_taxable, tax_item_code)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"""
        params = (t.taxpayer_id, t.transaction_date, t.year, t.month, t.day, t.type, t.source_id, 
                  t.payment_method_id, t.document_id, t.amount, t.description, t.is_taxable, t.tax_item_code)
        with self.db.get_connection() as conn:
            conn.execute(query, params)
            conn.commit()

    def update_transaction(self, t: Transaction):
        query = """UPDATE transactions SET taxpayer_id=?, transaction_date=?, year=?, month=?, day=?, type=?, 
                   source_id=?, payment_method_id=?, document_id=?, amount=?, description=?, is_taxable=?, 
                   tax_item_code=? WHERE id=?"""
        params = (t.taxpayer_id, t.transaction_date, t.year, t.month, t.day, t.type, t.source_id, 
                  t.payment_method_id, t.document_id, t.amount, t.description, t.is_taxable, t.tax_item_code, t.id)
        with self.db.get_connection() as conn:
            conn.execute(query, params)
            conn.commit()

    def delete_transaction(self, t_id: int):
        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM transactions WHERE id=?", (t_id,))
            conn.commit()

    def get_transactions(self, year=None, taxpayer_id=None, transaction_type=None, month=None) -> List[Dict]:
        query = """SELECT t.*, tp.full_name as taxpayer_name, s.name as source_name, pm.method_name,
                          d.doc_ref, d.display_name as doc_name, d.relative_path, d.gdrive_id
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
        
        query += " ORDER BY t.transaction_date DESC, t.id DESC"
        with self.db.get_connection() as conn:
            rows = conn.execute(query, params).fetchall()
            return [dict(row) for row in rows]

    def get_summary(self, year=None, taxpayer_id=None, transaction_type=None, month=None) -> Dict:
        txs = self.get_transactions(year, taxpayer_id, transaction_type, month)
        income = sum(t['amount'] for t in txs if t['type'] == TransactionType.INCOME)
        expense = sum(t['amount'] for t in txs if t['type'] == TransactionType.EXPENSE)
        taxable = sum(t['amount'] for t in txs if t['type'] == TransactionType.INCOME and t['is_taxable'])
        return {
            "total_income": income, "total_expense": expense, 
            "taxable_income": taxable, "net_income": income - expense
        }
