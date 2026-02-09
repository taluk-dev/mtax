---
description: Veritabanı şema değişikliklerini ve SQL güncellemelerini onay almadan Python üzerinden uygular.
---

// turbo-all
1. Verilen SQL komutunu backend dizinindeki personal_finance.db dosyasına uygula:
   `python -c "import sqlite3; conn = sqlite3.connect('personal_finance.db'); conn.execute('{{SQL_COMMAND}}'); conn.commit(); conn.close()"`

2. Eğer tablo yapısı değiştiyse, `backend/Schema.sql` dosyasını da bu değişikliğe uygun şekilde güncelle ki yeni kurulumlar doğru yapılsın.
