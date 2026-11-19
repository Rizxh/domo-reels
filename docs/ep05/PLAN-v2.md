# EP05 v2: "Masuk Sehat, Keluar Rusak" (planning revisi)

Status: **video final jadi, versi panjang** (2026-11-17): `out/video/ep05 - Masuk Sehat, Keluar Rusak.mp4`, 48,8 detik, 23,9 MB, −14,1 LUFS, true peak −2,7 dB, whisper 99%. Ditambah 4 beat cerita (penyesalan, jembatan ke fasad Doktermobil, temuan dijelaskan PERLU/BELUM PERLU, penutup "Masuk sehat, keluar tetap sehat"); VO tidak diperlambat. Batas durasi project 60 detik (keputusan user). Gerak dihaluskan: whip-pan blur antar scene, karakter bernapas, mobil memantul, debu/kilau. Kode: `src/paper/story/`. Caption: `docs/ep05/CAPTION.md`.

## Masukan yang dijawab

| Masukan | Jawaban di v2 |
|---|---|
| Background kurang menarik | Papan polos diganti **diorama kertas berlapis**: dinding bengkel, rak, pegboard perkakas, lampu gantung, lift mobil, dengan parallax depan/tengah/belakang |
| Aset terlalu sepi | Tiap shot punya foreground, subjek dan background; detail mesin (aki, radiator, selang, tutup oli, filter udara, blok mesin), perkakas, asap, percikan |
| Visual lebih real dan menarik | Proporsi karakter lebih realistis (bukan chibi), kertas berlapis dengan tekstur, bayangan, dan cahaya; gerak dengan easing, secondary motion, motion blur |
| Cerita: mesin dibuka, servis "sekalian" oleh oknum, jadi rusak | Babak 2 penuh dengan visual kerusakan (selang lepas, oli bocor, asap, lampu mesin menyala) |
| Doktermobil: cek dulu, alat modern, semua titik, form estimasi, pelayanan profesional | Babak 3 kontras: bengkel terang, scanner, checklist titik inspeksi, form estimasi disetujui pelanggan |
| Hook menarik dulu baru cerita | Detik 0: mobil sehat masuk, lalu cut keras ke mobil berasap, dengan teks "MASUK SEHAT, KELUAR RUSAK?" |
| Ending berantakan, CTA simple | Satu komposisi rapi di tengah safe area: logo, satu baris CTA, handle. Tidak ada elemen acak |

## Arah visual

- **Dua dunia, dua palet:**
  - Bengkel oknum: redup, hijau-abu kusam, lampu berkedip, perkakas berserakan.
  - Doktermobil: terang dan bersih, putih + merah brand, rapi, lantai mengkilap.
  - Kontras ini yang menjual, tanpa perlu banyak teks.
- **Diorama kertas 2,5D:** setiap scene tersusun 3–5 lapis kertas. Kamera bergerak (dolly, pan, push in) dan lapisannya bergeser dengan kecepatan berbeda, jadi terasa ada kedalaman. Shot tetap 2D papercraft, tapi terasa sinematik.
- **Aset baru (komponen, bisa dipakai ulang):**
  - Ruang mesin terbuka yang detail.
  - Montir oknum dan montir Doktermobil (seragam merah).
  - Pelanggan.
  - Scanner OBD dengan layar.
  - Tablet checklist.
  - Form estimasi.
  - Lift mobil, pegboard perkakas, rak oli, lampu gantung.
  - Efek: asap, tetesan oli, percikan, lampu indikator dashboard.
- **Teks layar minimal:** hanya hook, 1–2 label kunci, dan CTA. Caption kata per kata tetap di bawah.

## Naskah VO (kalimat utuh, intonasi bercerita)

| # | Babak | VO | Kata |
|---|---|---|---|
| 1 | Hook | "Masuk bengkel cuma servis ringan, keluarnya malah rusak." | 8 |
| 2 | Hook | "Ini modus oknum bengkel nakal." | 5 |
| 3 | Modus | "Kap dibuka, lalu ditawari servis tambahan: sekalian ini, sekalian itu." | 10 |
| 4 | Akibat | "Dikerjakan asal-asalan, selang lepas, lampu mesin menyala, tagihan ikut bengkak." | 10 |
| 5 | Solusi | "Di Doktermobil, mobil dicek dulu pakai alat scan modern di semua titik penting." | 13 |
| 6 | Solusi | "Hasilnya ditulis di form estimasi. Kamu setuju dulu, baru dikerjakan." | 10 |
| 7 | CTA | "Servis tenang, ya ke Doktermobil." | 5 |

61 kata, sekitar 30–33 detik. Lebih panjang dari batas 30 detik di CLAUDE.md. Opsi: naikkan batas ke 35 detik, atau pangkas kalimat 3–4.

## Storyboard

| Shot | VO | Visual | Kamera |
|---|---|---|---|
| 1 | "Masuk bengkel cuma servis ringan," | Mobil bersih masuk ke bengkel redup, papan "SERVIS RINGAN" di kaca | Low angle, dolly ikut mobil |
| 2 | "keluarnya malah rusak." | Cut keras: mobil yang sama keluar berasap, lampu mesin menyala di dashboard, judul "MASUK SEHAT, KELUAR RUSAK?" | Punch in cepat + guncangan kecil |
| 3 | "Ini modus oknum bengkel nakal." | Siluet montir oknum di ambang pintu, lampu berkedip, label "MODUS OKNUM" | Push in pelan |
| 4 | "Kap dibuka," | Kap mobil terangkat, ruang mesin detail terlihat | Crane turun ke ruang mesin |
| 5 | "sekalian ini, sekalian itu." | Montir menempel sticky note di banyak part (SEKALIAN GANTI, SEKALIAN FLUSHING…), nota memanjang | Pan cepat antar part |
| 6 | "Dikerjakan asal-asalan, selang lepas," | Kunci dibanting, baut tercecer, selang terlepas dan menyembur | Close-up makro, slow motion |
| 7 | "lampu mesin menyala, tagihan ikut bengkak." | Dashboard: check engine kuning menyala; asap keluar dari kap; nota menggembung | Cut ke dashboard, lalu wide |
| 8 | "Di Doktermobil," | Transisi wipe: dunia kusam tersapu, bengkel Doktermobil terang dan rapi, montir berseragam merah menyambut | Whip pan + reveal |
| 9 | "dicek dulu pakai alat scan modern" | Scanner OBD dicolok di bawah dashboard, layar menampilkan grafik dan "OK" | Makro di konektor, lalu layar |
| 10 | "di semua titik penting." | Mobil di lift, titik inspeksi menyala satu per satu (ban, rem, aki, oli, AC, kaki-kaki) dengan centang | Orbit 2,5D mengelilingi mobil |
| 11 | "Hasilnya ditulis di form estimasi." | Form estimasi rapi di tablet atau kertas, baris terisi dan total jelas | Top-down |
| 12 | "Kamu setuju dulu, baru dikerjakan." | Pelanggan tanda tangan, montir mengangguk, mulai bekerja dengan rapi | Medium, lalu dorong pelan |
| 13 | "Servis tenang, ya ke Doktermobil." | **CTA simple:** latar putih bersih, logo Doktermobil di tengah, satu baris "Booking servis di Doktermobil", handle @doktermobil. Semua rata tengah di safe area | Diam, elemen masuk berurutan |

## Suara

- VO: voice yang sama, kalimat utuh, tempo 2,0–2,4 kata/detik per kalimat.
- Musik orisinal dua warna: babak oknum tegang dan minor, lalu Doktermobil cerah dan mayor tepat saat transisi wipe.
- SFX: kap terbuka, baut jatuh, selang menyembur, desis asap, bip scanner, centang, tanda tangan.

## Klaim yang perlu dikonfirmasi tim Doktermobil

1. Doktermobil memakai alat scan (OBD/scanner) saat pengecekan.
2. Pengecekan dilakukan di "semua titik penting". Titik apa saja yang benar-benar dicek (ban, rem, aki, oli, AC, kaki-kaki)?
3. Estimasi tertulis diberikan dan disetujui pelanggan sebelum pekerjaan dimulai. Bentuknya form kertas atau tablet/aplikasi?
4. Contoh kerusakan oleh oknum (selang lepas, lampu mesin menyala) adalah ilustrasi umum, tidak menyebut bengkel tertentu.

## Teknis

- Format `paper` dikembangkan menjadi diorama berlapis: `src/paper/scene/*` per scene, parallax dari kamera 2D yang sudah ada, plus komponen aset baru di `src/paper/props/*`.
- Kit v1 (kertas sobek, spidol, stempel, sticky note) tetap dipakai sebagai detail.
- QA sama seperti biasa: still per shot, draft, final, loudness, whisper, lembar frame 2 fps, crop teks.
