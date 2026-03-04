# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-03-04

### Added
- `tax_items` table to the database schema (`Schema.sql`) for managing tax item codes and names independently.
- `TaxItem` interface and service in both Backend (Python/FastAPI) and Frontend (Angular).
- Support for API retrieving `tax_item_name` to be rendered in the Dashboard UI.

### Changed
- Replaced `tax_item_code` foreign key mapping in `transactions` with `tax_items_id` (INTEGER NOT NULL) to establish a proper relational bond with the `tax_items` table.
- Re-migrated existing database `transactions.tax_item_code` data into the separated `tax_items` schema and reassigned their relative `id`s.
- Upgraded the new transaction form UI (`transaction-form.component`) from a plain text input to a `mat-select` dropdown for choosing predefined tax items from the database.

### Removed
- Dropped the deprecated `tax_item_code` column from the `transactions` SQLite table to prevent data duplication.
