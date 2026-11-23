# Formula konten edukasi / kasus (format Toon) v2

Format: **Toon 3D**, yaitu karakter 2D datar di dunia 3D berwarna dengan garis tinta dan kamera yang bergerak terus. Durasi 40–59 detik, 1080×1920.

Pelajaran dari revisi EP11–EP13 dan referensi kelas iklan Grand Slam "Multi Platform Ads" (handbook + slide di Google Drive user) sudah masuk ke formula ini.

## 0. Sebelum menulis: desire dan premis

- **Copy gagal hanya karena satu alasan: tidak menjawab kebutuhan.**
- Copy tidak bisa *menciptakan* keinginan. Copy hanya *menyalurkan* keinginan yang sudah ada ke layanan kita.
- Daftar keinginan penonton, lalu pilih **satu yang paling mendesak**, dan jadikan itu **premis** video.
  - Contoh EP13: "malu di depan gebetan karena mobil bau", bukan sekadar "AC kotor".
- Tentukan tingkat kesadaran penonton (*awareness level*):
  - **Problem aware** (sadar masalahnya): tegaskan rasa sakitnya, lalu tunjukkan "kami dengar, kami bisa bantu".
  - **Unaware** (belum sadar): nyatakan masalahnya lebih dulu.

## Dua pola cerita

| Pola | Kapan dipakai | Struktur |
|---|---|---|
| **A. Kasus / iklan** (default) | Masalah yang dialami penonton, lalu layanan Doktermobil sebagai solusi | Hook → Problem → False Hope → Solusi/Isi → 3 fitur → Hasil → CTA |
| **B. Fun fact / sejarah** | Fakta unik (EP11 kampas rem tukang sepatu) | Hook → Isi → S·T·A·R → jembatan "Sekarang, …" → CTA |

Pola A mengikuti "Grand Structure" iklan 30 detik dari kelas Grand Slam:

```
HOOK  →  PROBLEM  →  FALSE HOPE  →  SOLUSI + ISI  →  FITUR 1-2-3  →  HASIL  →  CTA
0–4 s      3–4 s        4–6 s          8–12 s           4–6 s        3–4 s     5–6 s
```

- **False hope** adalah solusi yang sudah dicoba penonton tapi gagal, misalnya "pengharum udah ganti tiga kali, wanginya cuma sebentar". Bagian ini membuat penonton merasa "iya, aku juga gitu".
- **Fitur** adalah tiga hal yang dikerjakan Doktermobil, misalnya evaporator dibersihkan, filter diganti, saluran dilancarkan. Satu fitur = satu shot.

## Anggaran kata

Voice v3 dengan tempo 1,15 bicara sekitar **2,6–2,7 kata per detik**.

- Pola A: **105–130 kata** (40–50 detik).
- Pola B: **125–155 kata** (45–58 detik).
- Maksimal 60 detik.
- Kalau kepanjangan, pangkas isi. Jangan pernah memangkas hook atau CTA.

---

## 1. Hook (3 detik pertama)

Tanpa intro dan tanpa "halo". Kalimat pertama harus memicu satu emosi, dan **frame pertama sudah berupa puncak aksi**.

### Seven Deadly Hook (pilih satu, gabungkan dengan teknik di bawah)

| Jenis | Ciri | Contoh otomotif |
|---|---|---|
| Positive spin | Emosi positif | "Mobil 10 tahun ini dinginnya kayak baru keluar dealer." |
| Negative spin | Jangan / nggak / tidak | "Jangan semprot parfum kalau AC mobilmu bau apek." |
| Question | Pertanyaan yang dijawab penonton sendiri | "Pernah nggak sih AC dingin cuma pas pagi doang?" |
| Experience | Cerita pengalaman, paling kuat untuk pola A | "Gebetan Siska turun dari mobil sambil nutup hidung." |
| Social proof | Testimoni, komentar, viral (**hanya kalau nyata**) | "Ratusan mobil masuk Doktermobil dengan keluhan yang sama." |
| Call out | Memanggil target penonton | "Buat kamu yang mobilnya sering mogok pagi-pagi, jangan di-skip!" |
| How to | Tips / tutorial | "Cara cek kampas rem tanpa buka roda." |

### Teknik pengunci (minimal dua)

- **Open loop:** jawabannya baru keluar di tengah atau akhir video.
- **Kontras nggak masuk akal:** "mobil balap" kalah sama matic.
- **Kata pemicu:** malu, bau kambing, mayat, meledak, gratis.
- **"Kamu" langsung**, atau **taruhan nyata**: uang, harga diri, kesehatan.

Klaim "VIRAL" hanya boleh dipakai kalau memang ada sumbernya.

## 2. Isi yang dipahami orang awam (wajib)

Penonton tidak tahu bentuk dan letak komponen, jadi setiap penjelasan teknis harus punya tiga hal ini:

1. **Letak di mobil:** bodi mobil berubah transparan (x-ray) dan komponennya menyala, dengan label "AC ada di sini / di balik dasbor".
2. **Bentuk aslinya:** komponen digambar dengan detail nyata (evaporator: sirip, pipa tembaga, pipa U, katup; filter: lipatan dan bingkai) dan **diperlihatkan utuh dengan konteksnya**, jangan close-up ekstrem sampai jadi tekstur abstrak.
3. **Cara kerja / alur:** panah alur (misalnya KIPAS → FILTER KABIN → EVAPORATOR → KABIN), lalu label di setiap bagian berupa nama ditambah 3–5 kata penjelasan.

Prosesnya ditunjukkan sebagai animasi sebab-akibat, misalnya embun muncul saat kata "lembap" lalu jamur tumbuh saat kata "jamur". Perbaikannya juga ditunjukkan sebagai aksi nyata: busa disemprot lalu dibilas, filter lama dicabut lalu yang baru masuk, kotoran terdorong keluar selang.

## 3. CTA (ajakan langsung + urgensi)

Struktur VO: **pertanyaan gejala** → **"Langsung … di Doktermobil."** → **"Klik link di bio, karena di Doktermobil pasti beres!"**

Ini gaya kalimat Doktermobil sendiri dari video ko-lung-lung.

Kartu CTA bergaya iklan (`cta` di JSON), muncul pada kata `cta.at`:

- `eyebrow`: pita hitam berisi pertanyaan gejala ("AC MOBIL BAU APEK?").
- `line`: ajakan dua baris; baris kedua otomatis "di Doktermobil" berwarna merah.
- `button`: tombol merah besar yang berdenyut, "KLIK LINK DI BIO →".
- `tagline`: "Spesialis AC & Tune Up · Pasti Beres".
- **Tanpa @handle.**
- Kartu berada di tengah, di bawah papan logo bengkel (logo asli `public/brand/logo.png`). Subtitle di bawah kartu, dalam pita gelap.

## 4. Intonasi (voice v3, disetujui user)

- Pengaturan: `eleven_v3`, stability 0,5, similarity 0,9, exaggeration 0,35, tempo 1,15, pad 0,12.
- Isi `vo.tts` dengan tag emosi yang mengikuti alur:
  - hook `[shocked]` / `[laughs]`
  - problem `[embarrassed]` / `[disgusted]`
  - false hope `[frustrated]` / `[sighs]`
  - isi `[curious]` / `[explaining]`
  - solusi `[confident]`
  - fitur `[upbeat]`
  - hasil `[happy]`
  - CTA `[friendly]` → `[excited]`
- `vo.text` tetap bersih untuk subtitle.

---

## Aturan fakta

- Fakta sejarah dan angka butuh sumber kuat yang disebut di VO, ditampilkan sebagai chip "Sumber: …", dan dicatat di `claims`.
- Klaim teknis (penyebab, gejala, prosedur, layanan Doktermobil) ditulis di `claims` dengan `reviewed: false` dan wajib dicek teknisi.
- Cerita kasus memakai tokoh fiktif dan diberi tanda "Cerita ilustrasi; tokoh fiktif" di caption.

## Aturan naskah

- Kalimat utuh yang mengalir, bukan potongan dengan titik dua. Bahasa Indonesia santai.
- Kata cue unik di dalam scene-nya. Kalau kata yang sama dipakai dua kali, pakai `cue(n, kata, 2)`.
- Angka di layar sama persis dengan angka yang diucapkan.

## Aturan visual (toon)

- **Mobil:** varian kabin (MPV) dengan kaca berkilau, pilar dan list hitam, garis pintu, gagang, dan spion di pintu. Penumpang dilihat **lewat kaca depan, dari depan atau depan-samping**, dengan mobil **utuh di frame**. Jangan pakai sudut yang membuat pilar memotong wajah.
- **Hewan atau tokoh gag** harus langsung dikenali. Kambing digambar **profil samping**, bertanduk melengkung ke belakang, berjenggot, berpupil horizontal, tanpa bercak sapi.
- **Ukuran shot:** komponen dan karakter terlihat utuh dengan ruang di sekitarnya. Pakai medium, bukan extreme close-up.
- **Label dan subtitle:**
  - Label (`tag()`) tingginya 0,15–0,3 m pada shot medium, dan selalu di dalam frame.
  - Subtitle tampil per 2–3 kata. Kata kunci berwarna **kuning (#FFD60A)**.
- **Tanpa glitch:**
  - Cut bersih pada kata, jangan glide jauh dalam 20 frame.
  - Tidak ada objek trotoar (pohon, tiang) di antara kamera dan subjek.
  - Wajib lolos `python scripts/toon/qa.py "<video>"`: daftar `pops` dan `whips` harus kosong.
- **Cahaya** mengikuti cerita. Kamera selalu bergerak pelan (push), dengan shot baru setiap 2–4 detik.

## HD dan latar tanpa bocor (update 23 Nov 2026)

- **HD:** `node scripts/toon/render.mjs <id> "<Judul>" 240 2 hd|uhd` merender scene 3D pada 1440×2560 atau 2160×3840 asli (bukan upscale), CRF 14. Hasilnya `… (HD).mp4` / `… (UHD).mp4`. Render sekitar 2–4× lebih lama.
- **Latar tidak boleh bocor:**
  - Set kota sepanjang ±200 m dengan skyline melingkar.
  - Ruangan terbuka hanya ke arah kamera.
  - Mobil yang melaju harus tetap di tengah kota.
  - Cek frame terakhir setiap shot bergerak: tidak boleh ada rumput kosong, langit kosong, atau ujung set.
- **Interior mobil:** pakai `frontWide` (kamera di depan kaca depan, setinggi mata) supaya kursi, dasbor, dan penumpang terlihat seperti mobil sungguhan.
- **Karakter:** `Outfit.glasses` untuk kacamata. Hewan gag harus langsung dikenali.
