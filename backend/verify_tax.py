from core import Database, TaxpayerService, SourceService, TransactionService, TaxSettingService, DeclarationService, Transaction, Source, Taxpayer, TaxSetting, TransactionType
import sqlite3
import os
import json

# Use a test database
TEST_DB_NAME = "test_tax.db"
if os.path.exists(TEST_DB_NAME):
    os.remove(TEST_DB_NAME)

db = Database(TEST_DB_NAME)
db.init_db()

# Setup Services
tp_svc = TaxpayerService(db)
src_svc = SourceService(db)
tx_svc = TransactionService(db)
ts_svc = TaxSettingService(db)
dec_svc = DeclarationService(db)

# 1. Setup Taxpayer
with db.get_connection() as conn:
    conn.execute("INSERT INTO taxpayers (id, full_name) VALUES (1, 'Test User')")
    conn.commit()

# 2. Setup Sources
# - Residential (Gross)
# - Workplace (Net)
with db.get_connection() as conn:
    conn.execute("INSERT INTO sources (id, name, taxpayer_id, type, is_net, deduction_type) VALUES (1, 'Konut', 1, 1, 0, 0)")
    conn.execute("INSERT INTO sources (id, name, taxpayer_id, type, is_net, deduction_type) VALUES (2, 'İşyeri', 1, 1, 1, 0)")
    # - General Expense Source (e.g. Interest)
    conn.execute("INSERT INTO sources (id, name, taxpayer_id, type, is_net, deduction_type) VALUES (3, 'Faiz Gideri', 1, -1, 0, 0)")
    conn.commit()

# 3. Setup Settings (2025)
brackets = [
    {"limit": 158000, "rate": 0.15},
    {"limit": 380000, "rate": 0.20},
    {"limit": 800000, "rate": 0.27},
    {"limit": 1900000, "rate": 0.35},
    {"limit": 999999999, "rate": 0.40}
]
s2025 = TaxSetting(
    year=2025,
    exemption_amount=47000.0,
    declaration_limit=330000.0,
    lump_sum_rate=0.15,
    withholding_rate=0.20,
    tax_brackets=json.dumps(brackets)
)
ts_svc.save_settings(s2025)

# 4. Create Transactions (SCENARIO 2/3)
# - Residential Income: 240,000
# - Workplace Net Income: 320,000 -> Gross @ 20% = 400,000. Withholding = 80,000.
# - Interest Expense: 100,000

# Income 1: 240k
t1 = Transaction(id=None, taxpayer_id=1, transaction_date='2025-01-01', year=2025, month=1, day=1, type=TransactionType.INCOME, source_id=1, payment_method_id=1, document_id=None, amount=240000, is_taxable=True)
tx_svc.add_transaction(t1)

# Income 2: 320k (Net)
t2 = Transaction(id=None, taxpayer_id=1, transaction_date='2025-01-01', year=2025, month=1, day=1, type=TransactionType.INCOME, source_id=2, payment_method_id=1, document_id=None, amount=320000, is_taxable=True)
tx_svc.add_transaction(t2)

# Expense 1: 100k Interest
t3 = Transaction(id=None, taxpayer_id=1, transaction_date='2025-01-01', year=2025, month=1, day=1, type=TransactionType.EXPENSE, source_id=3, payment_method_id=1, document_id=None, amount=100000, is_taxable=True)
tx_svc.add_transaction(t3)

# Setup Special Deduction Source
with db.get_connection() as conn:
    conn.execute("INSERT INTO sources (id, name, taxpayer_id, type, is_net, deduction_type) VALUES (4, 'Sağlık', 1, -1, 0, 1)")
    conn.commit()

# Special Deduction Expense: 100k
t4 = Transaction(id=None, taxpayer_id=1, transaction_date='2025-01-01', year=2025, month=1, day=1, type=TransactionType.EXPENSE, source_id=4, payment_method_id=1, document_id=None, amount=100000, is_taxable=True)
tx_svc.add_transaction(t4)

# 5. Verify Auto-Fetch
fetched_deductions = dec_svc.get_special_deductions_from_db(1, 2025)
print("=== FETCHED DEDUCTIONS ===")
print(fetched_deductions)
assert len(fetched_deductions) == 1, "Should have 1 special deduction"
assert fetched_deductions[0]['name'] == 'Sağlık', "Name mismatch"
assert fetched_deductions[0]['amount'] == 100000, "Amount mismatch"

# 6. Run Calculation (Passing fetched deductions)
result = dec_svc.calculate(taxpayer_id=1, year=2025, method='actual', other_deductions=fetched_deductions)

print("=== CALCULATION RESULT ===")
for k, v in result.items():
    if isinstance(v, float):
        print(f"{k}: {v:.2f}")
    else:
        print(f"{k}: {v}")

# VERIFICATION CHECKS
assert abs(result['total_income'] - 640000) < 1.0, f"Total Income mismatch: {result['total_income']}"
assert result['exemption_applied'] == 47000, f"Exemption mismatch: {result['exemption_applied']}"
taxable = 640000 - 47000 # 593000
ratio = 593000 / 640000 # 0.9265625
expected_exp = 100000 * ratio # 92656.25
assert abs(result['deductible_expense'] - expected_exp) < 1.0, f"Deductible expense mismatch: {result['deductible_expense']} vs {expected_exp}"

safi_irat = 593000 - expected_exp # 500343.75
assert abs(result['safi_irat'] - safi_irat) < 1.0, "Safi Irat mismatch"

limit = safi_irat * 0.10 # 50034.375
allowed_special = min(100000, limit)
assert abs(result['allowed_special_deduction'] - allowed_special) < 1.0, "Special deduction limit mismatch"

matrah = safi_irat - allowed_special # 450309.375
assert abs(result['matrah'] - matrah) < 1.0, "Matrah mismatch"

print("\nAll Detailed Logic Checks Passed!")
