# mTax: Alternatif "Pure Firebase" (Serverless) Deployment Rehberi

Bu döküman, projeyi **Google Cloud Run** kullanmadan, tamamen **Firebase Hosting** ve **Angular SSR** altyapısı üzerinde nasıl çalıştırabileceğinizi açıklar. Bu model, sunucu yönetimini tamamen ortadan kaldıran "Full Serverless" yaklaşımdır.

---

## 1. Mimari Değişim: Sunucudan Fonksiyona

Bu senaryoda projenin katmanları şu şekilde değişir:

*   **Frontend & SSR:** [Firebase Hosting](https://firebase.google.com/docs/hosting). Angular SSR (Server Side Rendering) modunda deploy edildiğinde, Firebase arka planda her isteği bir **Firebase Cloud Function** (Node.js) üzerinden karşılar.
*   **Veritabanı (Zorunlu Değişiklik):** SQLite (lokal dosya) yerine [Firebase Firestore](https://firebase.google.com/docs/firestore) (Bulut NoSQL) kullanılmalıdır. 
    *   *Neden?* Cloud Functions stateless olduğu için her istekte dosya sistemi sıfırlanır. Kalıcı veri için uzak bir bulut veritabanı şarttır.
*   **Backend (Python/FastAPI):** Python kodunuzu Firebase üzerinde çalıştırmak için iki seçeneğiniz vardır:
    1.  **Firebase Functions (Python):** Mevcut FastAPI endpoint'lerini Firebase'in Python fonksiyonları olarak deploy etmek.
    2.  **SDK Metodu:** Backend katmanını tamamen aradan çıkarıp, Angular içerisinden doğrudan Firebase Firestore SDK'sını kullanmak.

---

## 2. Yapılması Gereken Temel Değişiklikler

### A. Veritabanı Geçişi (SQLite -> Firestore)
Lokal SQLite işlemlerini (CRUD) Firestore koleksiyonlarına taşımanız gerekir. 
- `core.py` içerisindeki SQL sorguları, `firebase-admin` kütüphanesi ile Firestore döküman işlemlerine dönüştürülmelidir.
- Veri yapısı (Transaction, Taxpayer vb.) tablolar yerine dökümanlar (JSON benzeri) olarak saklanacaktır.

### B. Python FastAPI -> Firebase Functions
Firebase artık Python desteğine sahiptir. Mevcut FastAPI uygulamanızı şu şekilde adapte edebilirsiniz:
```python
# firebase_main.py
from firebase_functions import https_fn
from api import app # Mevcut FastAPI app

@https_fn.on_request()
def mtax_api(req: https_fn.Request) -> https_fn.Response:
    # FastAPI'yi Firebase Function içine wrap eder
    with https_fn.as_wsgi(app) as (handler, _):
        return handler(req)
```

### C. Angular SSR Deployment
Angular projenizi Firebase'e hazırlamak için:
```bash
ng add @angular/fire
ng build --ssr
firebase deploy --only hosting,functions
```

---

## 3. Neden Bu Modeli Seçmelisiniz?

### Avantajları:
*   **Sıfır Sunucu Yönetimi:** Docker, Container Registry veya Instance yönetimiyle uğraşmazsınız.
*   **Daha Düşük Maliyet:** Cloud Run'a göre "Free Tier" (Ücretsiz Katman) kullanımı daha basitt esnektir.
*   **Tek Panel:** Her şeyi [Firebase Console](https://console.firebase.google.com/) üzerinden yönetirsiniz.

### Dezavantajları:
*   **Veritabanı Farkı:** SQLite (SQL) -> Firestore (NoSQL) geçişi ciddi kod değişikliği gerektirir.
*   **Hız:** İlk isteklerde "Cold Start" (soğuk başlama) gecikmesi yaşanabilir.

---

## 4. Güvenlik, Kota ve Spam Koruması

Public erişime açık her uygulamada olduğu gibi, kötü niyetli spam girişlerine ve kota doldurma saldırılarına karşı şu koruma katmanları mevcuttur:

### A. Firestore Ücretsiz Limitleri (Günlük)
Firebase **"Spark Plan" (Ücretsiz Plan)** altında her proje için ayrı limitler sunar:
*   **Veri Okuma:** Günlük 50.000 işlem.
*   **Veri Yazma:** Günlük 20.000 işlem.
*   **Depolama:** 1 GB (Toplam veri boyutu).
> **Önemli:** Bu limitler **her proje için ayrıdır**. Bir projenizin limitini doldurmanız hesabınızdaki diğer projeleri etkilemez.

### B. Spam ve Saldırı Koruması (Savunma Katmanları)
1.  **Security Rules:** Sadece login olmuş (`auth != null`) ve sadece kendi verisine erişen kullanıcılara izin vererek yetkisiz okuma/yazma spamini engeller.
2.  **Firebase App Check:** Gelen isteğin gerçekten sadece sizin Angular uygulamanızdan geldiğini doğrular. Botlardan gelen istekleri veritabanına ulaşmadan kapıda reddeder.
3.  **DDoS Koruması:** Google Cloud altyapısı otomatik olarak L3/L4 seviyesindeki büyük çaplı bot saldırılarını filtreler.

---

## 5. Kritik Uyarılar

*   **Bütçe Güvenliği:** Spark (Ücretsiz) plandaysanız ve günlük kota dolarsa uygulama erişime kapanır ancak **sizden asla izinsiz para çekilmez.**
*   **Auth Zorunluluğu:** Uygulamanızı public açmadan önce mutlaka **Firebase Authentication** eklemelisiniz. Şifresiz erişim tüm verilerinizin (ve kotanızın) risk altında olması demektir.
*   **Kredi Kartı:** Cloud Functions (SSR için) kullanımı modern versiyonlarda Blaze Plan'a (Pay-as-you-go) geçilmesini isteyebilir. Bu durumda mutlaka **Bütçe Uyarıları (Budget Alerts)** kurulmalıdır.

---
*Hazırlayan: Antigravity AI Assistant*
