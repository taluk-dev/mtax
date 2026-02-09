# mTax - Premium Finance & Tax Management System

mTax provides a high-performance, industrial-grade experience for managing personal and corporate finances. Built with a **FastAPI** backend and a cutting-edge **Angular 21 (Zoneless + Signals)** frontend, it represents the modern standard for financial tracking.

## 🚀 Key Features

- **Modern Architecture:** Built with Angular v21 using Zoneless Change Detection and Signals for maximum response speed.
- **Premium UI:** Designed with **Angular Material 19** and **Tailwind CSS**, featuring a unified design system with sleek gradients and glassmorphism.
- **Dedicated Page Workflow:** Transitioned from modal-based entries to a dedicated, high-focus standalone form page for transactions.
- **Multi-Mode Forms:** Single, intelligent form component handling Create, Edit, and Duplicate operations with context-aware titles and logic.
- **FastAPI Core:** Python-based asynchronous backend for blazing-fast data processing and robust API interactions.
- **Advanced Summaries:** Real-time calculation of Net Status, Total Income, Expense, and Taxable Base directly on the dashboard.
- **Tax Declaration Logic:** Comprehensive tax calculation module supporting gross-up for net income, exemptions, expense methods (lump-sum vs actual), and progressive tax brackets.
- **Detailed Tax Breakdown:** Visualizes effective tax rates and exact tax amounts per bracket for full transparency.
- **Column-Based Filtering:** Powerful multi-criteria filtering integrated into the data table headers for Taxpayer, Type, Source, and Taxable status.
- **Global Search:** Instant filtering across descriptions, amounts, and taxpayer names.

## 🛠 Tech Stack

- **Frontend:** Angular 21 (Standalone, Zoneless, Signals)
- **Styling:** Tailwind CSS + Angular Material 19
- **Backend:** FastAPI (Python 3.10+)
- **Database:** SQLite3
- **API Documentation:** Automatically available via Swagger/OpenAPI (Access at `/docs`)

## 🔧 Installation

1. **Install Python Dependencies:**
   ```bash
   pip install fastapi uvicorn python-dotenv pydantic
   ```

2. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   ```

## 🏃 Running the Application

### The Easy Way (Windows)
Simply double-click the **`mTax_start.bat`** file in the root directory. This will start both the API and the UI, then open your browser.

### The Manual Way
1. **Start Backend:**
   ```bash
   # From root
   cd backend
   python api.py
   ```
2. **Start Frontend:**
   ```bash
   # From root
   cd frontend
   npm start
   ```
Access the application at `http://localhost:4200`.

## 📁 Project Structure

```text
mtax/
├── backend/             # Python API & Database
│   ├── api.py           # FastAPI Server (Routes & Schemas)
│   ├── core.py          # Business Logic & Database Services
│   ├── Schema.sql       # Database Schema
│   └── personal_finance.db # Production-ready SQLite Database
├── frontend/            # Angular Project Root
│   ├── src/app/pages/
│   │   ├── dashboard/   # Main data view with integrated filters
│   │   └── transaction-form/ # Standalone entry/edit/duplicate page
│   └── src/app/api.service.ts # Centralized API communication
├── mTax_start.bat       # Windows One-Click Quick-Launcher
└── README.md            # Comprehensive documentation
```

## 💡 Developer Notes

- **Optimized UI:** Replaced the previous sidenav/drawer system with a full-page transaction form for better focus and data entry speed.
- **Signal-Driven:** The frontend architecture relies heavily on Angular Signals for reactive state management without Zone.js overhead.
- **Backend Sync:** The API has been extended to support single-record retrieval for editing and deep-copying transactions.
- **Tax Engine:** A dedicated `DeclarationService` (in `core.py`) handles complex logic including:
    -   **Gross-Up:** Calculates theoretical gross income from net payments (e.g., workplace rent) and derives withholding tax as a credit.
    -   **Exemption Handling:** Automatically applies residential exemption logic.
    -   **Expense Allocation:** Supports both lump-sum (15%) and actual expense methods (with proportional deduction logic: `Taxable / Total Income`).
    -   **Special Deductions:** Auto-fetches flagged expenses (e.g., Health, Education) from the DB and applies a 10% cap based on Safi İrat.
- **Data Integrity:** `source_id` is mandatory. Added `is_net` and `deduction_type` columns to `sources` to support advanced tax calculations. New tables `tax_settings` and `declarations` store configuration and history.

---
*Developed with focus on performance, aesthetics, and modern web standards.*
