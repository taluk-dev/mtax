---
description: Projede önemli değişiklikler (şema, yeni özellik, hata çözümü vb.) yapıldığında veya oturum sonunda CHANGELOG.md dosyasını güncelle.
---

Bu workflow, ajan (agent) tarafından proje kök dizinindeki `CHANGELOG.md` dosyasına oturum içindeki yeni özellikleri eklemek için kullanılmalıdır.

1. Proje ana dizininde yer alan `CHANGELOG.md` dosyasını `view_file` ile oku.
2. Oturum boyunca yapılan tüm kayda değer değişiklikleri incele.
3. [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) standardına uygun olarak değişiklikleri kategoriye ayır:
   - `Added` (Yeni özellikler)
   - `Changed` (Mevcut fonksiyonalite değişiklikleri)
   - `Deprecated` (Kullanımdan kalkacak özellikler)
   - `Removed` (Kaldırılmış olan özellikler)
   - `Fixed` (Hata ve bug düzeltmeleri)
   - `Security` (Güvenlik iyileştirmeleri)
4. Dosyanın içeriğini, `[Unreleased]` başlığı altında yer alan ilgili kategorilere (örneğin `### Added` veya `### Changed`) eklemeler yapacak şekilde, `multi_replace_file_content` veya `replace_file_content` gibi uygun tool'lar kullanarak kalıcı olarak güncelle.
