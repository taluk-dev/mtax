# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.0] - 2026-03-04

### Added
- Complete CRUD (Create, Read, Update, Delete) functionality for "Vergi Kalemleri" (Tax Items) under the Definitions section.
- New `TaxItems` component and route (`/definitions/tax-items`) in the Frontend.
- Corresponding Backend API endpoints (`POST`, `PUT`, `DELETE` /tax-items) and service methods in `core.py`.

## [2.2.0] - 2026-03-04

### Added
- Added metadata-driven filtering for "VERGİ KODU" (Tax Item Code) column in the Dashboard transaction table.
- Backend support for filtering by `tax_items_id` in `get_transactions` and `get_summary` methods.

### Changed
- Modified `transactions.tax_items_id` column to `NOT NULL` in `Schema.sql` to ensure data integrity.
- Migrated existing `NULL` values in `transactions.tax_items_id` to a default value (8) and applied the schema constraint to the database.
- Simplified "VERGİ KODU" filter dropdown to only display tax codes for a cleaner interface.


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


