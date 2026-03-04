---
description: Apply database schema changes and SQL updates via Python without requiring confirmation.
---

// turbo-all
1. Apply the given SQL command to the `personal_finance.db` file in the backend directory:
   `python -c "import sqlite3; conn = sqlite3.connect('personal_finance.db'); conn.execute('{{SQL_COMMAND}}'); conn.commit(); conn.close()"`

2. If the table structure has changed, strongly ensure to update the `backend/Schema.sql` file accordingly so that new installations are configured correctly.
