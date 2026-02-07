BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "payment_methods" (
	"id"	INTEGER,
	"method_name"	TEXT NOT NULL,
	PRIMARY KEY("id")
);
CREATE TABLE IF NOT EXISTS "sources" (
	"id"	INTEGER,
	"name"	TEXT NOT NULL,
	"detail"	TEXT,
	"taxpayer_id"	INTEGER,
	"share_percentage"	REAL DEFAULT 1.0,
	"default_amount"	REAL,
	PRIMARY KEY("id"),
	FOREIGN KEY("taxpayer_id") REFERENCES "taxpayers"("id")
);
CREATE TABLE IF NOT EXISTS "taxpayers" (
	"id"	INTEGER,
	"full_name"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "transactions" (
	"id"	INTEGER,
	"taxpayer_id"	INTEGER,
	"transaction_date"	DATE NOT NULL,
	"year"	INTEGER,
	"month"	INTEGER,
	"day"	INTEGER,
	"type"	INTEGER,
	"source_id"	INTEGER,
	"payment_method_id"	INTEGER,
	"document_no"	TEXT,
	"description"	TEXT,
	"amount"	REAL NOT NULL,
	"is_taxable"	BOOLEAN DEFAULT FALSE,
	"tax_item_code"	TEXT,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("payment_method_id") REFERENCES "payment_methods"("id"),
	FOREIGN KEY("source_id") REFERENCES "sources"("id"),
	FOREIGN KEY("taxpayer_id") REFERENCES "taxpayers"("id")
);
COMMIT;
