# 📱 Panduan Setting Perangkat Photobooth

Untuk: **Xiaomi Pad 5** (kiosk) · **DJI Osmo Pocket 3** (kamera opsional) · **Canon SELPHY CP1500** (cetak opsional) · lampu · box.
Prasyarat: aplikasi sudah di Vercel & backend Apps Script aktif — lihat [README.md](README.md) §1–2.

> Label **[saran]** = rekomendasi praktis, sesuaikan dengan venue. **[uji]** = belum bisa dipastikan dari spesifikasi, cek sendiri saat gladi.

---

## 0. Daftar perangkat

| Perangkat | Peran | Status |
|---|---|---|
| Xiaomi Pad 5 + charger & kabel | Layar sentuh tamu + kamera depan 8 MP | Wajib |
| Koneksi internet (Wi-Fi venue / hotspot HP) | Upload ke Drive & QR tamu. Pad 5 **Wi-Fi only** | Wajib |
| Box / stand + kabel roll | Tempat tablet, kabel tersembunyi | Wajib |
| Ring light / lampu LED | Kualitas foto (venue pernikahan biasanya redup) | Sangat disarankan |
| DJI Osmo Pocket 3 + kabel USB-C **data** | Kamera kualitas tinggi (1-inch) | Opsional — lihat §3 |
| Laptop (Chrome) | Dibutuhkan jika Pocket 3 tidak terbaca tablet, atau ingin cetak tanpa dialog | Opsional |
| Canon SELPHY CP1500 + paket kertas/tinta KP-108IN | Cetak 4R | Opsional — lihat §4 |

### Pilih mode
| Mode | Kamera | Layar tamu | Kapan dipakai |
|---|---|---|---|
| **A — Tablet saja** | Kamera depan Pad 5 | Pad 5 | Paling simpel, Rp 0 tambahan |
| **B — Tablet + Pocket 3** | Pocket 3 via USB-C | Pad 5 | Hanya jika Pocket 3 terdeteksi di tablet (§3.1) |
| **C — Laptop + Pocket 3** | Pocket 3 via USB-C | Laptop / monitor | Kualitas terbaik + bisa cetak tanpa dialog |

---

## 1. Xiaomi Pad 5 — pengaturan sistem (H-3)
Nama menu bisa sedikit beda antar versi HyperOS/MIUI — pakai kolom **cari** di Settings.

1. **Update Chrome** di Play Store.
2. **Layar:** kecerahan tinggi, matikan *adaptive/auto brightness*, set *Sleep* paling lama. (Selama aplikasi terbuka, layar juga ditahan menyala oleh aplikasi.)
3. **Rotasi:** pegang tablet **portrait**, lalu kunci rotasi. Kamera depan Pad 5 ada di **tepi atas** saat portrait → posisi ideal untuk photobooth berdiri.
4. **Notifikasi:** aktifkan *Do Not Disturb*.
5. **Baterai:** matikan *Battery saver*; di pengaturan aplikasi **Chrome** (cari "Chrome" di Settings › Apps), set penghemat baterai ke *No restrictions / Tanpa batasan* agar tidak dihentikan sistem.
6. Lepas case yang menutupi kamera depan, **lap lensa**.
7. **Wi-Fi:** sambungkan ke jaringan yang akan dipakai di venue (atau hotspot HP) → buka speedtest, catat kecepatan **upload**: [uji].

## 2. Xiaomi Pad 5 — pasang aplikasi (H-3)
1. Buka **https://photobooth-wine-iota.vercel.app** (URL produksi) di Chrome → muncul izin kamera → **Izinkan**.
2. Chrome ⋮ → **Install app / Add to Home screen** → buka dari ikon di home screen (layar penuh, tanpa address bar).
3. Buka **Admin**: ketuk **pojok kiri atas 5×** → PIN `1234`.
4. **Drive & QR:** buka **link setup** `https://photobooth-wine-iota.vercel.app/#setup=…` sekali di Chrome tablet (URL & token terisi otomatis, toast “✓ Tersambung ke Google Drive”) — atau tempel *Web App URL* + *Token* manual → **Tes koneksi** harus ✓, tautan folder & database bisa dibuka. Link setup = **rahasia** (berisi token); perangkat lain bisa scan *QR setup* di menu yang sama.
5. **Acara:** teks atas, nama, tanggal, teks penutup, warna aksen, nama folder Drive.
6. **Bingkai:** nyalakan yang dipakai; pilih *Atribut disarankan* per bingkai; upload bingkai / atribut kustom (PNG transparan) bila ada.
7. **Sesi:** hitung mundur 3–5 dtk [saran], ulang sesi 1×, kembali ke awal 60 dtk, format **PNG** (atau **JPG** kalau upload lambat). Atribut: *Tombol di layar review* (disarankan). *Simpan otomatis ke galeri* & *Tombol Bagikan*: nyala.
8. **Sistem:** **ganti PIN**.
9. **Uji:** 1 sesi penuh → scan QR pakai **HP lain dengan data seluler** (bukan Wi-Fi yang sama) → foto harus muncul.
10. **Galeri:** sesi pertama, Chrome bisa bertanya “izinkan download banyak file?” → **Izinkan**. Cek aplikasi **Galeri › album Download**: foto harus ada [uji di Pad 5].
    Jika notifikasi/snackbar unduhan mengganggu tamu, matikan *Simpan otomatis ke galeri* — foto tetap aman di galeri aplikasi & Drive.
11. **Bagikan:** share sheet memakai aplikasi di tablet (WhatsApp, Quick Share, Bluetooth). Jangan login WhatsApp pribadi di tablet kiosk, atau matikan *Tombol Bagikan*.

### Mode kiosk (hari H)
1. Settings → cari **"pin"** → aktifkan *Screen pinning / Sematkan aplikasi*.
2. Buka aplikasi Photobooth → buka *Recent apps* → sematkan aplikasi Photobooth.
3. Cara keluar mengikuti petunjuk yang muncul di layar saat menyematkan — **coba sekali saat gladi**.
4. Colok charger terus selama acara.

**Titik status (pojok kanan atas):** hijau = kamera & Drive OK · kuning = ada antrean upload · merah = offline/gagal (foto tetap aman di galeri).

---

## 3. DJI Osmo Pocket 3 (opsional)
Mode webcam Pocket 3 resmi untuk **komputer** (USB-C, UVC 1080p). Di Android, kamera USB hanya terbaca jika didukung pabrikan tablet — makanya perlu dites.

### 3.1 Tes ke Pad 5 (5 menit)
1. Pocket 3 baterai penuh → nyalakan.
2. Sambungkan ke Pad 5 dengan kabel **USB-C data** (bukan kabel charge-only).
3. Jika layar Pocket 3 menampilkan pilihan koneksi, pilih **Webcam**.
4. Aplikasi: Admin › **Kamera** → **Cari ulang** → lihat daftar *Sumber kamera*.
5. **Muncul kamera baru** → pilih → **Tes jepret** → pakai **Mode B**.
   **Tidak muncul** → tablet tidak mendukung → pakai **Mode A** atau **Mode C**.

### 3.2 Mode C — laptop + Pocket 3
1. Laptop (Windows/Mac) → buka URL produksi di **Chrome** → izinkan kamera.
2. Colok Pocket 3 → pilih **Webcam**.
3. Admin (`Ctrl+Shift+A`) › Kamera › pilih Pocket 3 → **Tes jepret**.
4. Isi Drive & QR, Acara, dst. — pengaturan per perangkat, tidak ikut dari tablet.
5. Layar tamu: laptop (atau monitor sentuh eksternal). Matikan *sleep* laptop selama acara.
6. **Cetak tanpa dialog (opsional):** jadikan printer foto sebagai *default*, lalu buat shortcut Chrome:
   ```
   chrome.exe --kiosk --kiosk-printing https://URL-PRODUKSI-KAMU
   ```
   Tutup semua jendela Chrome dulu sebelum membuka shortcut ini.

### 3.3 Posisi & daya
- Tripod setinggi mata orang dewasa [saran], sedikit menunduk ke tamu; jarak tamu 1,5–2 m untuk 2–4 orang [saran].
- Hasil Pocket 3 landscape 16:9 → paling tajam untuk bingkai **Photo Strip** (kotak foto landscape). Bingkai portrait tetap bisa, dengan crop.
- Daya: isi penuh sebelum acara; durasi baterai di mode webcam: [uji saat gladi — cek indikator tiap jam]. Siapkan charger/power bank.

---

## 4. Printer Canon SELPHY CP1500 (opsional)
1. Pasang **kaset kertas ukuran Postcard** + kaset tinta (paket **KP-108IN** = 108 lembar 4×6).
2. **Wi-Fi:** sambungkan printer ke **Wi-Fi yang sama dengan tablet** (Wi-Fi venue / hotspot).
   ⚠️ Jangan sambungkan tablet langsung ke Wi-Fi printer (mode koneksi langsung): Pad 5 hanya punya Wi-Fi, jadi tablet akan **kehilangan internet** → upload & QR berhenti.
3. Tablet: pasang **Mopria Print Service** dari Play Store → aktifkan.
4. **Tes cetak (foto terakhir)** (Admin › Cetak) → di dialog Android: pilih **Canon SELPHY CP1500**, ukuran kertas **Postcard (100×148 mm)** → Cetak.
5. Berhasil → nyalakan *Printer tersambung* → (opsional) *Cetak otomatis* → *Maks cetak per sesi*.
   Browser tidak bisa mendeteksi printer: selama sakelar ini mati (atau printer dicabut — matikan sakelarnya), tamu yang menekan **Cetak** melihat pop-up **“Printer tidak tersambung”**.
6. Saat acara: setiap cetak muncul dialog Android → tamu/operator tekan **Cetak**.
7. Kecepatan ±41 detik per lembar → saat ramai akan antre; siapkan beberapa paket kertas.
8. **Photo Strip** dicetak 2 strip per lembar → siapkan gunting/pemotong (1 untuk tamu, 1 untuk buku tamu).

---

## 5. Lampu
- Ring light di belakang/sekeliling tablet, **setinggi wajah**, menghadap tamu [saran].
- Samakan suhu warna lampu dengan lampu venue (ring light bi-color bisa diatur) agar kulit tidak belang [saran].
- Hindari jendela / lampu terang **di belakang** tamu (backlight).
- Tanpa ring light: Admin › Kamera › **Layar flash** (layar putih sesaat sebelum jepret).

## 6. Box / stand
- Tablet **portrait**, lubang kamera tepat di **tepi atas** layar; jangan tutup speaker (bunyi hitung mundur).
- Tinggi tengah layar ±130–140 cm untuk tamu berdiri [saran]; uji dengan tamu tinggi & pendek.
- Lubang kabel di belakang, ventilasi, tablet terkunci (anti jatuh/anti hilang).
- Backdrop 1,5–2 m di belakang posisi tamu [saran].
- Tempel stiker kecil di box: "Sentuh layar → pilih bingkai → senyum → scan QR".

## 7. Jaringan
- Pad 5 hanya Wi-Fi → wajib Wi-Fi venue atau **hotspot HP** (siapkan cadangan).
- Upload lambat → ganti format ke **JPG** (Admin › Sesi). Kuota yang dibutuhkan: [Fill manually — ukuran file × jumlah sesi, cek di Admin › Acara › Statistik saat gladi].
- Internet putus: aplikasi tetap jalan, foto tetap tersimpan di galeri, upload menyusul otomatis, QR tetap berlaku.

---

## 8. Checklist

**H-7**
- [ ] Backend Apps Script aktif, *Tes koneksi* ✓
- [ ] Teks acara & bingkai final, dites 1 sesi per bingkai
- [ ] Tes Pocket 3 (§3.1) → tentukan mode A / B / C
- [ ] Tes cetak 3–5 lembar
- [ ] Gladi 10 sesi + scan QR dari HP lain (data seluler)

**H-1**
- [ ] Charge: tablet, Pocket 3, power bank
- [ ] Bawa: charger, kabel roll, kabel USB-C data, tripod, ring light, paket kertas, lap lensa, lakban, gunting
- [ ] Cek kuota hotspot cadangan

**Hari H (60 menit sebelum mulai)**
- [ ] Pasang box, lampu, backdrop; colok charger
- [ ] Buka aplikasi dari ikon → titik status hijau
- [ ] 1 sesi uji + scan QR
- [ ] Sematkan aplikasi (screen pinning)

**Setelah acara**
- [ ] Admin › Drive & QR: **antre = 0**
- [ ] Admin › Galeri › **Simpan semua ke galeri perangkat** (cadangan)
- [ ] Admin › Galeri › **Hapus yang sudah di Drive**
- [ ] (Opsional) bagikan link folder Drive acara ke pengantin/klien

## 9. Masalah umum
| Gejala | Solusi |
|---|---|
| Kamera hitam / tidak muncul | Izin kamera Chrome → *Izinkan*; tutup aplikasi lain yang memakai kamera; Admin › Kamera › **Cari ulang** |
| Pocket 3 tidak muncul di daftar | Pakai kabel data; pilih *Webcam* di Pocket 3; kalau tetap tidak muncul → mode A atau C |
| Titik merah / "Upload tertunda" | Cek internet; foto tetap aman; Admin › Drive & QR › **Upload ulang sekarang** |
| Dialog cetak tidak ada printer | Tablet & printer harus di Wi-Fi yang sama; Mopria aktif |
| Tamu lihat “Printer tidak tersambung” | Sakelar Admin › Cetak › *Printer tersambung* mati — nyalakan setelah tes cetak berhasil |
| Foto tidak ada di Galeri | Album **Download**; Chrome › gembok › Izin situs › *Download otomatis*: Izinkan |
| Hasil cetak terpotong / ukuran salah | Di dialog cetak pilih ukuran **Postcard**; Admin › Cetak › ukuran kertas |
| Tamu bisa keluar dari aplikasi | Aktifkan screen pinning (§2) |
| Perlu diagnosa | Admin › Sistem › **Log error** — kirim isinya |
