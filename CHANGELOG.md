# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
## [2.5.0] - 2026-03-22

### Added
- Implemented the ability to delete declarations directly from the "Geçmiş Beyannameler" list in the Declaration UI, including finalized declarations.
- Created `DELETE /declarations/{dec_id}` API endpoint in the backend and integrated it into the frontend `ApiService`.
- Integrated a delete button with a confirmation dialog into the `declaration.component.html` list items, along with `.meta-section` styling to align the net tax amount and the delete action button.

## [2.4.0] - 2026-03-20

### Added
- Added "Gider Kalemleri Detayı" (Actual Expenses Breakdown) sub-table in the "Hesaplama Sonucu" section when the "Gerçek Gider" method is toggled.
- Implemented backend data grouping logic in `DeclarationService.calculate` within `core.py` to aggregate expenses by their `tax_items` identities and injected `actual_expenses_breakdown` into the response payload.

### Changed
- Improved the expense breakdown interface interactivity by adding a light-yellow hover highlight effect across breakdown rows.
- Structured breakdown table components using a flexbox layout, adding a new fixed-width `.code` CSS class to horizontally align tax codes.
- Relocated the `matTooltip` behavior to the parent wrapper in Angular to display the source's name across the entire row surface area.

### Fixed
- Fixed **422 Unprocessable Entity** regression error blocking "Taslak Kaydet" (Save Draft) network requests by ensuring `taxpayer_id` and `year` attributes are present in the component's generated payload object.

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


