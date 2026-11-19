# EP01 3D Concept: Panasin Mesin 15 Menit

Creative concept untuk versi 3D EP01 seri **"Mitos atau Fakta?"**. Dokumen ini menjawab *apa* yang kita buat dan *kenapa*. Cara membangunnya ada di `PRODUCTION.md`. Referensi visual yang bisa diputar: `previz.html` di folder ini (buka di browser).

---

## 1. Logline

Pengendara yang masih memanaskan mobil 15 menit tiap pagi diajak melihat langsung ke dalam ruang mesin: kenapa kebiasaan itu lahir di era karburator, dan kenapa mesin injeksi modern cukup 30 sampai 60 detik lalu jalan pelan.

## 2. Audiens dan tujuan

| Item | Isi |
|---|---|
| Audiens | Pemilik mobil harian 25 sampai 50 tahun, Jabodetabek, bukan orang teknik |
| Masalah | Kebiasaan turun temurun yang boros bensin dan waktu |
| Satu pesan | Mesin injeksi: panaskan 30 sampai 60 detik, lalu jalan pelan |
| Aksi | Save video, follow @doktermobil |
| Metric utama | Retensi detik ke 3 (hook) dan jumlah save |

## 3. Kenapa 3D

1. **Bisa menunjukkan yang tidak terlihat.** Footage bengkel tidak bisa memperlihatkan injektor menyemprot atau sinyal ECU mengalir. 3D bisa, dan itulah inti penjelasannya.
2. **Kontras visual jadi argumen.** Set karburator dibuat hangat, kasar, dan bergetar; set injeksi dibuat bersih, dingin, dan stabil. Penonton merasakan bedanya sebelum membaca teks.
3. **Kit yang dipakai ulang.** Mobil, karakter, dashboard, dan bengkel menjadi aset tetap untuk episode berikutnya (AC, ban, aki, lampu dashboard). Episode ke 2 dan seterusnya jauh lebih murah.

## 4. Gaya visual

**Arah: "studio miniature".** 3D low-poly yang bersih dengan sudut membulat, material realistis (cat clearcoat, chrome, karet), refleksi environment, dan bayangan lembut. Bukan photoreal dan bukan kartun datar.

| Set | Mood | Cahaya dan warna | Gerak |
|---|---|---|---|
| Carport (hook, masuk mobil, jalan, knalpot) | Pagi Jakarta | Matahari rendah hangat, langit biru ke krem | Kamera push-in, handheld halus |
| Mesin karburator (mitos) | Jadul, film lama | Sepia, flicker lampu, grain, vignette | Mesin bergetar kasar, kipas berputar, jam berputar cepat |
| Mesin injeksi (fakta) | Modern, presisi | Netral dingin, rim light biru | Getaran sangat halus, injektor berdenyut berurutan, sinyal ECU mengalir |
| Dashboard (alasan) | Sudut pandang pengemudi | Indikator menyala, jalan di luar | Jarum bergerak halus, jalan bergerak saat berkendara |
| Bengkel (CTA) | Doktermobil | Hitam dan merah brand, lampu strip | Lift naik, mekanik melambai lalu jempol |

**Brand:** merah `#E31E24`, hitam `#0B0B0B`, putih. Headline Anton, body dan caption Poppins. Tidak ada logo pabrikan mobil di aset mana pun.

**Karakter:**
- *Pengendara*: kemeja biru lengan panjang, jam tangan di tangan kiri, ekspresi gelisah.
- *Mekanik Doktermobil*: seragam merah dengan strip putih, topi merah, ramah.

## 5. Struktur dan timing (dari VO yang sudah di-generate)

Durasi mengikuti VO ElevenLabs di `public/audio/ep01/` (pad 0,2 dtk sebelum dan 0,35 dtk sesudah VO, transisi 0,3 dtk, outro 1 dtk). Total sekitar **29,6 detik**, mepet batas 30 detik.

| Beat | Waktu (approx) | VO (sudah ada) | Shot 3D | Teks layar |
|---|---|---|---|---|
| S1 Hook | 0:00 s/d 0:04.0 | "Masih manasin mobil lima belas menit tiap pagi? Stop dulu!" | Carport: mobil idle, pengendara cek jam lalu geleng kepala, push-in ke wajah | STOP manasin mobil 15 MENIT! |
| S2 Mitos | 0:03.7 s/d 0:08.2 | "Itu kebiasaan zaman mesin karburator." | Orbit mesin karburator sepia, jam 15 menit berputar | Stamp MITOS, label **Karburator** dan **Choke manual** |
| S3 Fakta | 0:07.9 s/d 0:17.0 | "Mobil injeksi sekarang cukup dipanasin tiga puluh sampai enam puluh detik, terus jalan pelan di beberapa menit pertama." | (a) Orbit mesin injeksi, (b) pengendara buka pintu dan duduk, (c) mobil jalan pelan keluar carport | Stamp FAKTA, label **Injektor**, **ECU**, **Sensor suhu**, counter 0 ke 60 DETIK |
| S4 Kenapa | 0:16.7 s/d 0:24.3 | "Kelamaan idle bikin boros bensin. Padahal mesin lebih cepat panas kalau dibawa jalan santai." | (a) Jarum bensin turun, (b) jarum suhu naik sambil jalan | Kartu alasan 1/2 dan 2/2 dengan meter bergerak |
| S5 CTA | 0:24.0 s/d 0:29.6 | "Simpan video ini, dan follow Doktermobil buat tips rawat mobil lainnya." | Bengkel: lift naik, mekanik melambai lalu jempol | SAVE biar nggak lupa, Follow @doktermobil |

**Catatan beat Kenapa:** previz punya 3 alasan (termasuk *Nambah polusi* dengan shot knalpot). VO yang sudah kamu generate hanya 2 alasan, jadi EP01 memakai 2 alasan. Shot knalpot tetap ada di kit dan bisa dipakai jika VO diubah (lihat `PRODUCTION.md` bagian 9).

## 6. Copy layar dan label komponen

Semua copy tinggal di `data/episodes/ep01.json`, bukan di komponen.

| Label | Sub-label |
|---|---|
| Karburator | Campur bensin dan udara secara mekanis |
| Choke manual | Perlu ditunggu sampai mesin stabil |
| Injektor | Semprot bensin presisi tiap siklus |
| ECU | Atur campuran otomatis sejak mesin dingin |
| Sensor suhu | Kasih tahu ECU kondisi mesin |

| Kartu alasan | Isi | Visual meter |
|---|---|---|
| 1/2 Boros bensin | Mesin idle tetap minum bensin, padahal mobil diam di tempat | Timer idle 00:00 ke 15:00, bar tangki turun (tanpa angka liter) |
| 2/2 Lebih cepat capai suhu kerja | Jalan santai kasih beban ringan, mesin panas lebih cepat dan merata | Termometer 30 ke 90°C, penanda suhu kerja |

## 7. Sound design

| Momen | Suara |
|---|---|
| Frame 0 | Alert / whoosh pendek |
| Stamp MITOS / FAKTA | Thud / stamp |
| Label komponen muncul | Tick halus |
| Counter selesai | Ding |
| Kartu alasan | Pop |
| Set karburator | Idle kasar samar di bawah BGM (opsional) |
| CTA | BGM swell lalu fade 0,5 dtk |

BGM dan SFX hanya dari sumber berlisensi komersial, dicatat di `public/audio/bgm/LICENSES.md`.

## 8. Klaim yang wajib dicek teknisi sebelum publish

1. Mesin injeksi cukup idle 30 sampai 60 detik, lalu jalan pelan beberapa menit pertama.
2. Karburator dengan choke manual memang butuh pemanasan lebih lama.
3. Fungsi ECU dan sensor suhu dalam mengatur campuran saat mesin dingin (penyederhanaan untuk awam).
4. Suhu kerja mesin sekitar 90°C (rentang umum, bisa beda per model).
5. Mesin lebih cepat mencapai suhu kerja saat dibawa jalan pelan dibanding idle.

## 9. Kit 3D yang dipakai ulang

| Aset | Episode yang bisa memakai |
|---|---|
| Mobil MPV (pintu bisa dibuka, roda berputar, lampu emissive) | Semua |
| Pengendara dan mekanik (rig sendi sederhana) | Semua |
| Dashboard (gauge canvas texture, layar tengah, ventilasi AC) | EP02 AC, EP04 lampu dashboard, EP05 aki |
| Ruang mesin (bay, kap terbuka) | EP05 aki, EP06 rem (ganti isi) |
| Bengkel Doktermobil | CTA semua episode |
| Sistem label komponen 3D ke layar | Semua episode edukasi |
