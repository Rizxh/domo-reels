# EP03: "Ban Tebal Belum Tentu Aman" (planning + produksi)

Status: **video final jadi, VO v2** (2026-11-16): `out/video/ep03 - Ban Tebal Belum Tentu Aman.mp4`, 28,9 detik, 1080×1920, 24,4 MB, −14,1 LUFS, true peak −2,4 dB, whisper 100% naskah berurutan (laporan `out/qc/ep03_report.md`, lembar frame `out/qc/ep03_sheet.jpg`, cek 2 fps `out/look/ep03/final-vo2/`). Caption: `docs/ep03/CAPTION.md`. Format: **Jarang Diketahui, 3D sinematik (React Three Fiber)**, composition `Cinema3D`, episode `data/episodes/ep03.json`, dunia 3D `src/cinema/worlds/tire/`.

---

## 1. Topik

**Fakta inti:** alur ban bisa masih tebal, tapi umurnya sudah lewat batas. Umur ban tertulis di dinding ban: **4 angka terakhir kode DOT = minggu dan tahun produksi**. Contoh `1215` = minggu ke-12 tahun 2015, jadi pada November 2026 ban itu sudah berumur 11 tahun.

Kenapa topik ini:

- **Dekat dengan penonton:** semua mobil punya ban, hampir tidak ada yang pernah membaca kode itu. Ban serep dan mobil yang jarang dipakai paling sering kena.
- **Rasa penasaran:** hook-nya pernyataan yang terdengar salah ("masih tebal, tapi sudah pensiun"), lalu petunjuknya (4 angka) sudah terlihat di beat 2, tapi artinya baru dibuka di beat 4.
- **Hanya 3D yang bisa:** makro alur ban seperti ngarai, retak halus yang tumbuh, kode DOT yang di-rack focus.
- **Nyambung ke layanan Doktermobil:** cek kondisi dan umur ban saat servis.

Belum pernah dibahas: EP01 panasin mesin, EP02 100 ledakan per detik, talking head Tune Up Express.

## 2. Spesifikasi

| Item | Nilai |
|---|---|
| Format | 1080×1920, 30 fps, H.264 + AAC |
| Durasi | Target 26–29 detik (mengikuti VO, maksimal 30) |
| Loudness | −14 LUFS, true peak ≤ −1,5 dB |
| Label seri | JARANG DIKETAHUI |
| Output | `out/video/ep03 - Ban Tebal Belum Tentu Aman.mp4` |

## 3. Naskah VO

57 kata, sekitar 26 detik bicara + jeda dan outro. Revisi VO v2 (2026-11-16): naskah v1 terdengar patah-patah dan membingungkan (potongan pendek dengan titik dua, tempo antar kalimat 1,8 sampai 2,45 kata per detik). Versi ini memakai kalimat utuh yang mengalir; tempo antar kalimat seragam 2,05 sampai 2,31 kata per detik. Take v1 disimpan di `out/sound/vo-backup/ep03/v1`.

| # | Beat | VO | Kata |
|---|---|---|---|
| 1 | Hook | "Alur ban ini masih tebal, tapi udah waktunya pensiun." | 9 |
| 2 | Petunjuk | "Kok bisa? Jawabannya di empat angka kecil ini." | 8 |
| 3 | Kenapa umur penting | "Karet ban menua walau jarang dipakai, jadi mengeras, retak halus, cengkeramannya turun." | 12 |
| 4 | Jawaban | "Dua angka depan minggunya, dua angka belakang tahunnya. Ban ini buatan dua ribu lima belas. Sebelas tahun!" | 17 |
| 5 | Aturan + CTA | "Lewat sepuluh tahun, saatnya ganti. Cek ban mobilmu, dan follow Doktermobil." | 11 |

### Teks layar (semua di `ep03.json`, diikat ke kata VO)

| Beat | Teks | Kata |
|---|---|---|
| 1 | JARANG DIKETAHUI (tag seri) | frame 0 |
| 1 | ALUR MASIH TEBAL | "tebal" |
| 1 | TAPI WAKTUNYA PENSIUN | "pensiun" |
| 2 | 4 ANGKA INI (callout elips ke kode di dinding ban; artinya belum dijelaskan) | "empat" |
| 3 | MENGERAS / RETAK HALUS / CENGKERAMAN TURUN | "mengeras" / "retak" / "cengkeramannya" |
| 4 | 12 = MINGGU | "minggunya" |
| 4 | 15 = TAHUN | "tahunnya" |
| 4 | 2015 | "ribu" |
| 4 | 11 TAHUN | "Sebelas" |
| 5 | LEWAT 10 TAHUN: GANTI + catatan kecil "Lewat 5 tahun: cek rutin tiap tahun" | "sepuluh" |
| 5 | Logo + Follow @doktermobil | "follow" |

### Klaim yang harus dicek teknisi (`reviewed: false` di JSON)

1. Empat angka terakhir kode DOT di dinding ban = minggu (2 angka) dan tahun (2 angka) produksi, berlaku untuk ban produksi sejak tahun 2000.
2. Ban yang dijual di Indonesia mencantumkan kode tanggal 4 angka ini.
3. Karet ban menua walau ban jarang dipakai (oksidasi, panas, sinar UV): mengeras, retak halus, cengkeraman turun, terutama di jalan basah.
4. Panduan umum pabrikan ban: setelah 5 tahun dicek rutin tiap tahun, dan diganti paling lambat 10 tahun sejak tanggal produksi walau alur masih tebal (beberapa pabrikan mobil menyarankan 6 tahun). Ditampilkan sebagai catatan kecil di layar.
5. Kode `1215` (minggu ke-12, 2015) = sekitar 11 tahun per November 2026. Kalau video tayang setelah Maret 2027, ganti VO "Sebelas tahun" atau kodenya.

## 4. Alur cerita dan shot

Cerita satu kalimat: kita tertipu oleh alur yang masih tebal, kamera mencari bukti di dinding ban, kita lihat apa yang dilakukan waktu pada karet, lalu kode dibaca dan ternyata ban itu sudah 11 tahun.

Setiap shot 1,5–3 detik; potongan jatuh di kata VO.

| Shot | Beat | Isi | Kamera |
|---|---|---|---|
| 1 | Hook | Ngarai alur ban, cahaya menyapu rendah, tetes air | Makro rendah menyusuri alur, DOF tipis |
| 2 | Hook | Roda utuh di studio gelap, rim light merah | Crane mundur cepat ke 3/4 depan |
| 3 | Petunjuk | Tulisan dinding ban lewat di cahaya miring | Dolly menyusuri dinding ban |
| 4 | Petunjuk | Oval kode tanggal, callout "4 ANGKA INI" | Dorong pelan |
| 5 | Umur | Roda diam, cahaya matahari berputar cepat (time lapse) | Wide rendah, dorong pelan |
| 6 | Umur | Retak halus tumbuh di karet | Makro, geser pelan |
| 7 | Umur | Roda melaju di aspal basah malam, cipratan, sedikit selip | Low angle tracking |
| 8 | Jawaban | Oval kode tajam, "12" menyala, label MINGGU | Makro frontal, rack focus masuk |
| 9 | Jawaban | Geser ke "15", label TAHUN | Slide lateral |
| 10 | Jawaban | "2015" besar | Tarik mundur |
| 11 | Jawaban | Roda tua dengan retak, rim light merah, "11 TAHUN" | Whip ke wide dramatis |
| 12 | CTA | Roda berputar pelan di turntable, cahaya bersih | Orbit |
| 13 | CTA | Kembali ke ngarai alur (loop ke frame 0), logo + follow | Makro dorong |

## 5. Aset

Semua dibuat dengan kode (R3F), tanpa model pihak ketiga:

- Ban 205/55 R16: profil lathe, 5 rusuk alur instanced dengan sipe, bahu membulat, tulisan dinding ban sebagai bump map dari canvas (tanpa merek: TUBELESS, RADIAL, ukuran, kode DOT `DOT B7 3F 9XR 1215`).
- Velg alloy 5 palang, baut, tutup tengah polos (tanpa logo).
- Retak halus: overlay alpha-test dengan urutan tumbuh (seeded, deterministik).
- Aspal basah: tekstur CC0 Poly Haven `asphalt_02` (sudah ada di `public/assets/polyhaven`, lisensi di sana).
- Cahaya: Lightformer prosedural (tanpa unduhan HDR saat render), bloom, DOF, AO, vignette, tone mapping AgX.

## 6. Suara

| Lapisan | Rencana |
|---|---|
| VO | ElevenLabs (voice di `.env`), timestamp per kata |
| Musik | Orisinal, disintesis `scripts/music.ts` (`npm run music`): denyut gelap + detak jam yang menegang sampai "Sebelas tahun!", lalu akor lega di CTA. Dicatat di LICENSES.md |
| SFX | Disintesis `scripts/sfx.ts`: tick jam, retak, desis ban di jalan basah, whoosh, slam angka, pop teks |
| Mix | VO −25 LUFS per kalimat, musik turun saat VO, hasil akhir −14 LUFS |

## 7. Cek kualitas

- `npm test` + `npx tsc --noEmit` (schema: setiap cue harus kata yang ada di VO).
- Draft render → contact sheet dan still resolusi penuh per kartu teks (`out/look/`).
- Final: `npm run produce -- ep03` → laporan `out/qc/ep03_report.md` (durasi, codec, loudness, whisper vs naskah, lembar frame).
