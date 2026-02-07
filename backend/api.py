from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, model_validator
from datetime import date
from typing import List, Optional, Dict, Any
import uvicorn

# core.py içerisindeki mevcut servisleri kullanıyoruz
from core import Database, TaxpayerService, SourceService, TransactionService, PaymentMethodService, DocumentService, Transaction, Document

app = FastAPI(title="mTax API", version="2.0.0")

# Angular (genelde 4200 portu) için CORS ayarı
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Geliştirme aşamasında her yerden istek kabul ediyoruz
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servisleri başlatalım
db = Database()
tp_service = TaxpayerService(db)
src_service = SourceService(db)
tx_service = TransactionService(db)
pm_service = PaymentMethodService(db)
doc_service = DocumentService(db)

# --- SCHEMAS (Pydantic models for API) ---
class TransactionIn(BaseModel):
    taxpayer_id: int
    transaction_date: date
    year: int
    month: Optional[int] = None
    day: Optional[int] = None
    type: int
    source_id: Optional[int] = None
    payment_method_id: int
    amount: float
    description: Optional[str] = None
    document_id: Optional[int] = None
    is_taxable: bool = False

    @model_validator(mode='before')
    @classmethod
    def handle_null_date_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            tx_date = data.get('transaction_date')
            if isinstance(tx_date, str):
                parts = tx_date.split('-')
                if len(parts) == 3:
                    year, month, day = parts
                    modified = False
                    if month == 'null':
                        month = '06'
                        modified = True
                        if data.get('month') is None:
                            data['month'] = 6
                    if day == 'null':
                        day = '15'
                        modified = True
                        if data.get('day') is None:
                            data['day'] = 15
                    
                    if modified:
                        data['transaction_date'] = f"{year}-{month}-{day}"
        return data

class DocumentIn(BaseModel):
    doc_ref: Optional[str] = None
    display_name: str
    relative_path: str
    gdrive_id: Optional[str] = None

# --- ENDPOINTS ---

@app.get("/metadata")
async def get_metadata():
    """Dropdownlar için gerekli tüm verileri döner"""
    return {
        "taxpayers": tp_service.get_all(),
        "sources": src_service.get_all(),
        "payment_methods": pm_service.get_all()
    }

@app.get("/transactions")
async def get_transactions(
    year: Optional[int] = Query(None),
    taxpayer_id: Optional[int] = Query(None),
    type: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    source_id: Optional[List[int]] = Query(None),
    is_taxable: Optional[bool] = Query(None)
):
    txs = tx_service.get_transactions(year=year, taxpayer_id=taxpayer_id, transaction_type=type, month=month, source_id=source_id, is_taxable=is_taxable)
    summary = tx_service.get_summary(year=year, taxpayer_id=taxpayer_id, transaction_type=type, month=month, source_id=source_id, is_taxable=is_taxable)
    return {
        "transactions": txs,
        "summary": summary
    }

@app.post("/transactions")
async def add_transaction(tx: TransactionIn):
    # Pydantic modelini core.py Transaction modeline çevir
    new_tx = Transaction(
        id=None,
        taxpayer_id=tx.taxpayer_id,
        transaction_date=tx.transaction_date,
        year=tx.year,
        month=tx.month,
        day=tx.day,
        type=tx.type,
        source_id=tx.source_id,
        payment_method_id=tx.payment_method_id,
        document_id=tx.document_id,
        amount=tx.amount,
        description=tx.description,
        is_taxable=tx.is_taxable
    )
    tx_service.add_transaction(new_tx)
    return {"status": "success"}

@app.put("/transactions/{tx_id}")
async def update_transaction(tx_id: int, tx: TransactionIn):
    up_tx = Transaction(
        id=tx_id,
        taxpayer_id=tx.taxpayer_id,
        transaction_date=tx.transaction_date,
        year=tx.year,
        month=tx.month,
        day=tx.day,
        type=tx.type,
        source_id=tx.source_id,
        payment_method_id=tx.payment_method_id,
        document_id=tx.document_id,
        amount=tx.amount,
        description=tx.description,
        is_taxable=tx.is_taxable
    )
    tx_service.update_transaction(up_tx)
    return {"status": "updated"}

@app.delete("/transactions/{tx_id}")
async def delete_transaction(tx_id: int):
    tx_service.delete_transaction(tx_id)
    return {"status": "deleted"}

@app.post("/documents")
async def add_document(doc: DocumentIn):
    new_doc = Document(
        id=None,
        doc_ref=doc.doc_ref,
        display_name=doc.display_name,
        relative_path=doc.relative_path,
        gdrive_id=doc.gdrive_id
    )
    doc_id = doc_service.add_document(new_doc)
    return {"document_id": doc_id}

if __name__ == "__main__":
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)
