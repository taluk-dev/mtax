# mTax: Firebase & Google Cloud Deployment Rehberi

Bu döküman, mevcut Angular + FastAPI + SQLite projenizi Google Cloud ve Firebase ekosistemine taşıyarak public erişime açmak için izlenmesi gereken yol haritasını içerir.

---

## 1. Bulut Mimarisi (Cloud Architecture)

Projenin serverless altyapıda çalışabilmesi için mevcut "Lokal" yapı "Cloud-Native" yapıya dönüştürülmelidir:

*   **Frontend (Angular):** [Firebase Hosting](https://firebase.google.com/docs/hosting) üzerinde barındırılır. Global CDN üzerinden hızlı erişim sağlar.
*   **Backend (FastAPI):** [Google Cloud Run](https://cloud.google.com/run) üzerinde bir Docker container olarak çalışır. Gelen isteğe göre otomatik ölçeklenir (Request yoksa maliyet sıfırdır).
*   **Veritabanı (Database):** SQLite yerini [Google Cloud SQL](https://cloud.google.com/sql) (PostgreSQL) veya [Firebase Firestore](https://firebase.google.com/docs/firestore)'a bırakmalıdır.
*   **Dosya Saklama:** Yerel klasörler yerine [Google Cloud Storage](https://cloud.google.com/storage) kullanılmalıdır.

---

## 2. Teknik Hazırlıklar

### A. Veritabanı Değişikliği (En Kritik Adım)
SQLite tek bir dosyadır ve bulut sunucuları (Cloud Run) stateless (durumsuz) olduğu için her restart sonrası veri kaybı yaşanır.
- `backend/core.py` içerisinde `sqlite3` yerine `SQLAlchemy` veya `asyncpg` kütüphanesine geçilmelidir.
- Veritabanı bağlantısı bir çevre değişkeninden (`DATABASE_URL`) okunmalıdır.

### B. Backend Dockerization
Cloud Run'da çalışmak için bir `Dockerfile` gereklidir:
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8080"]
```

### C. Frontend Ortam Ayarları
`frontend/src/environments/` altında `environment.prod.ts` oluşturulmalı:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://backend-url-from-cloud-run.a.run.app'
};
```

---

## 3. Deployment Adımları

1.  **Firebase Projesi:** [Firebase Console](https://console.firebase.google.com/) üzerinden yeni bir proje oluşturun.
2.  **API Deployment:** 
    - Google Cloud SDK yükleyin.
    - `gcloud run deploy` komutu ile backend'i yayına alın.
3.  **Frontend Deployment:**
    - `firebase login`
    - `firebase init hosting`
    - `ng build --configuration production`
    - `firebase deploy --only hosting`

---

## 4. Güvenlik ve Maliyet Notları

*   **Authentication:** Uygulamayı public açmadan önce mutlaka `Firebase Auth` eklenmelidir. Aksi takdirde finansal verileriniz tüm internete açık kalır.
*   **Maliyet:** Firebase Hosting'in ücretsiz katmanı oldukça geniştir. Google Cloud Run "Free Tier" kapsamındadır ancak Cloud SQL (PostgreSQL) kullanımı aylık düşük bir maliyet oluşturabilir.

---
*Hazırlayan: Antigravity AI Assistant*
