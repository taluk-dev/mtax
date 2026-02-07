# mTax - Premium Finance & Tax Management System

mTax is a high-performance, modern financial tracking application built with a **FastAPI** backend and an **Angular 21 (Zoneless + Signals)** frontend. It provides a premium, industrial-grade experience for managing personal and corporate finances.

## 🚀 Key Features

- **Modern Architecture:** Built with Angular v21 using Zoneless Change Detection and Signals for maximum speed.
- **Premium UI:** Designed with **Angular Material 3** and **Tailwind CSS**, featuring dark/light modes and glassmorphism elements.
- **FastAPI Core:** Python-based asynchronous backend for blazing-fast data processing.
- **Side-Panel Interactions:** All CRUD operations (Create, Edit, Delete) happen in a side-drawer without page reloads.
- **Advanced Summaries:** Real-time calculation of Net Status, Total Income, Expense, and Taxable Base.
- **Zoneless Performance:** Optimized for the lowest possible browser overhead in 2026 standards.

## 🛠 Tech Stack

- **Frontend:** Angular 21 (Standalone, Zoneless, Signals)
- **Styling:** Tailwind CSS + Angular Material 3
- **Backend:** FastAPI (Python 3.10+)
- **Database:** SQLite3
- **API Documentation:** automatically available via Swagger/OpenAPI

## 🔧 Installation

1. **Install Python Dependencies:**
   ```bash
   pip install fastapi uvicorn python-dotenv
   ```

2. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   ```

## 🏃 Running the Application

### The Easy Way (Windows)
Simply double-click the **`mTax_Baslat.bat`** file in the root directory. This will start both the API and the UI, then open your browser.

### The Manual Way
1. **Start Backend:**
   ```bash
   python api.py
   ```
2. **Start Frontend:**
   ```bash
   cd frontend
   npm start
   ```
Access the application at `http://localhost:4200`.

## 📁 Project Structure

```text
mtax/
├── backend/             # Python API & Database
│   ├── api.py           # FastAPI Server (Entry point)
│   ├── core.py          # Business Logic & Database Services
│   ├── Schema.sql       # Database Schema
│   └── personal_finance.db # SQLite Database
├── frontend/            # Angular Project Root
│   ├── src/app/         # Modern Signals-based logic
│   └── src/styles.scss  # Material 3 & Tailwind implementation
├── mTax_start.bat       # Windows One-Click Quick-Launcher
└── README.md            # You are here!
```

---
*Developed with focus on performance, aesthetics, and modern web standards.*
