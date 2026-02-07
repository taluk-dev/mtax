# mTax: Personal Finance & Tax Management System

mTax is a lightweight, local-first financial tracking application built with Python and Streamlit. It is designed to manage personal and business transactions, track income/expenses, and calculate taxable income for annual declarations.

## 🚀 Features

- **Dashboard:** Real-time financial metrics including Total Income, Expenses, Net Status, and Taxable Base.
- **Transaction Management:** Full CRUD (Create, Read, Update, Delete) operations for financial records.
- **Flexible Date Support:** Support for transactions with unknown months or days (ideal for legacy records).
- **Advanced Filtering:** Filter records by Year, Taxpayer, or Transaction Type.
- **Data Export:** Export filtered lists to CSV for use in Google Sheets or Excel.
- **Local-First:** Uses SQLite for data storage, ensuring privacy and speed.

## 🛠 Tech Stack

- **Backend/Logic:** Python 3.10+
- **Frontend:** Streamlit
- **Database:** SQLite3
- **Data Handling:** Pandas

## 📋 Prerequisites

- Python 3.10 or higher installed.
- Pip (Python package manager).

## 🔧 Installation

1. **Clone or Extract the Project:**
   Navigate to the project directory.

2. **Install Dependencies:**
   Run the following command in your terminal:
   ```bash
   pip install streamlit pandas openpyxl
   ```

3. **Initialize Database:**
   The database is automatically initialized on the first run using `Schema.sql`.

## 🏃 Running the Application

### Option 1: Terminal (Professional)
Run the following command:
```bash
streamlit run app.py
```

### Option 2: Windows Shortcut (User-Friendly)
Double-click the `mTax_Baslat.bat` file in the root directory.

## 🌍 Deployment

To deploy this application to the web:

1. **Streamlit Community Cloud (Recommended):**
   - Push the code to a Private/Public GitHub repository.
   - Connect your GitHub account to [Streamlit Cloud](https://share.streamlit.io/).
   - Select the repository and `app.py` as the main file.
   
   *Note: For persistent cloud storage, consider switching SQLite to a cloud database like PostgreSQL or Snowflake.*

## 📁 Project Structure

```text
mtax/
├── app.py              # Main UI and User Interaction logic
├── core.py             # Business Logic (Models, Services, Database Manager)
├── Schema.sql          # Database Schema definition
├── personal_finance.db # SQLite Database file (Data)
├── mTax_Baslat.bat     # Windows Quick-Launcher
└── README.md           # Documentation
```

## 👨‍💻 Developer Notes

- **Architecture:** The app uses a simplified Service-Layer pattern inside `core.py`.
- **Date Fallbacks:** If the month or day is missing in the record, the system defaults to June 15th for the SQL `DATE` constraint while preserving the `NULL` state in dedicated year/month/day columns.
- **CSV Export:** Uses `utf-8-sig` encoding to ensure compatibility with Turkish characters in Microsoft Excel.

---
*Developed with love for efficient financial management.*
