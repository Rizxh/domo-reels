# EP04: "Bensin Boros? Cek Mesinnya" (planning)

Status: **video final jadi** (2026-11-16): `out/video/ep04 - Bensin Boros Cek Mesinnya.mp4`, 28,4 detik, 13,3 MB, −14,1 LUFS, true peak −2,9 dB, whisper 98% (satu-satunya selisih: "nggak" ditulis "gak"). Laporan `out/qc/ep04_report.md`, cek 2 fps `out/look/ep04/final/`. Caption: `docs/ep04/CAPTION.md`. Naskah final ada di `data/episodes/ep04.json` (kalimat 2–4 sedikit dipadatkan dari tabel di bawah supaya di bawah 30 detik).

Format: **3D sinematik (React Three Fiber)**, format `cinema` seperti EP03, dengan dunia 3D baru `engine` (ruang mesin).

---

## 1. Topik

**Inti pesan:** bensin cepat habis saat harga BBM lagi berat bisa jadi karena mesin kotor, bukan karena mobilnya boros. Tune Up Express Doktermobil membersihkan lima titik kotor itu sekaligus, Rp499 ribu.

Sumber fakta layanan: video talking head Tune Up Express di repo (`data/talking-head/ko-lung-lung*.json`): harga Rp499 ribu, cepat, membersihkan intake, throttle, busi, kepala piston, dan katalitik.

Kenapa topik ini:

- **Dekat dengan penonton:** semua orang merasakan isi bensin makin sering.
- **Rasa penasaran:** hook-nya keluhan yang relatable ("baru isi, jarumnya udah turun lagi?"), lalu kamera mencari "pencuri bensinnya" di dalam mesin; jawabannya (5 titik kotor) dibuka satu per satu, solusinya baru muncul di akhir.
- **Nyambung ke layanan:** langsung ke paket Tune Up Express.

## 2. Spesifikasi

| Item | Nilai |
|---|---|
| Format | 1080×1920, 30 fps, H.264 + AAC |
| Durasi | Target 26–29 detik (maksimal 30) |
| Loudness | −14 LUFS, true peak ≤ −1,5 dB |
| Label seri | TIPS HEMAT BBM |
| Output | `out/video/ep04 - Bensin Boros Cek Mesinnya.mp4` |

## 3. Naskah VO

56 kata, sekitar 25 detik bicara. Ditulis sebagai kalimat utuh yang mengalir (pelajaran dari EP03: potongan pendek bikin intonasi TTS patah-patah).

| # | Beat | VO | Kata |
|---|---|---|---|
| 1 | Hook | "Baru isi bensin, jarumnya udah turun lagi?" | 7 |
| 2 | Ketegangan | "Bisa jadi bukan mobilnya yang boros, tapi mesinnya yang kotor." | 10 |
| 3 | Penyebab | "Kerak di intake, throttle, busi, kepala piston, sampai katalitik bikin pembakaran nggak sempurna, jadi bensin lebih boros." | 17 |
| 4 | Solusi | "Tune Up Express Doktermobil membersihkan kelima bagian itu, cukup empat ratus sembilan puluh sembilan ribu." | 14 |
| 5 | CTA | "Mesin bersih, bensin lebih awet. Booking sekarang, pasti beres!" | 9 |

### Teks layar (diikat ke kata VO)

| Beat | Teks | Kata |
|---|---|---|
| 1 | TIPS HEMAT BBM (tag) | frame 0 |
| 1 | BARU ISI, UDAH TURUN? | "turun" |
| 2 | BUKAN MOBILNYA... / MESINNYA KOTOR | "boros" / "kotor" |
| 3 | INTAKE, THROTTLE, BUSI, KEPALA PISTON, KATALITIK (callout satu per satu ke bagiannya, counter 1/5 sampai 5/5) | tiap nama bagian |
| 3 | PEMBAKARAN NGGAK SEMPURNA | "sempurna" |
| 4 | TUNE UP EXPRESS + label harga Rp499 RIBU | "Express" / "ribu" |
| 4 | 5 BAGIAN DIBERSIHKAN | "kelima" |
| 5 | Logo + "Booking sekarang" + PASTI BERES | "Booking" / "beres" |

### Klaim yang harus dicek sebelum tayang

1. Harga Tune Up Express masih Rp499 ribu dan berlaku di semua cabang (atau tambahkan "mulai dari" / nama cabang).
2. Paket membersihkan kelima bagian: intake, throttle, busi, kepala piston, katalitik.
3. Kerak di bagian-bagian itu bisa membuat pembakaran kurang sempurna dan bensin lebih boros (tidak menyebut angka persen penghematan).
4. CTA "Booking sekarang": arahkan ke mana (link di bio, WhatsApp, aplikasi)? Caption mengikuti.

## 4. Alur cerita dan shot

Cerita satu kalimat: jarum bensin turun terlalu cepat, kamera masuk ke mesin mencari "pencuri bensin", menemukan lima titik berkerak, lalu satu sapuan Tune Up Express membuat semuanya mengkilap lagi.

| Shot | Beat | Isi | Kamera |
|---|---|---|---|
| 1 | Hook | Jarum bensin di dashboard merosot ke E, lampu bensin kuning berkedip | Makro, dorong pelan |
| 2 | Hook | Angka di pompa bensin berputar cepat (tanpa harga spesifik) | Close-up miring |
| 3 | Ketegangan | Kap mesin, kamera menembus masuk ke ruang mesin gelap | Dolly masuk |
| 4 | Penyebab | Intake berjelaga | Makro geser |
| 5 | Penyebab | Throttle body, cincin kerak di katup kupu-kupu | Orbit pendek |
| 6 | Penyebab | Busi, elektroda hitam berjelaga | Makro, rack focus |
| 7 | Penyebab | Kepala piston berkerak di ruang bakar | Tilt turun |
| 8 | Penyebab | Katalitik, sarang lebah tersumbat | Push in ke penampang |
| 9 | Penyebab | Api pembakaran merah-oranye berasap ("nggak sempurna") | Makro ruang bakar |
| 10 | Solusi | Sapuan cahaya lewat kelima bagian, kerak hilang, logam mengkilap | Tarik mundur cepat, lihat semua bagian |
| 11 | Solusi | Label harga Rp499 RIBU berayun masuk | Medium |
| 12 | CTA | Api biru bersih, lalu logo, Booking sekarang, PASTI BERES | Dorong pelan |

## 5. Aset

Semua dibuat dengan kode (R3F), tanpa model pihak ketiga: gauge bensin, panel angka pompa, intake, throttle body dengan katup, busi, piston di ruang bakar, katalitik sarang lebah, shader kerak dan api (bersih vs kotor). Logo resmi dari `public/brand/logo.png`.

## 6. Suara

| Lapisan | Rencana |
|---|---|
| VO | ElevenLabs (voice yang sama), kalimat utuh, tempo dicek 2,0–2,4 kata/detik |
| Musik | Orisinal (`npm run music`): groove tegang yang berubah cerah di bagian solusi |
| SFX | Disintesis: tik pompa bensin, whoosh, desis kerak, sapuan bersih, ding harga |

## 7. Cek kualitas

Sama seperti EP03: test schema, still per shot, draft, render final, laporan QA (durasi, loudness, whisper 100%), lembar frame 2 fps, crop teks.
