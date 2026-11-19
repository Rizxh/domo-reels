# EP02 3D: "100 Ledakan per Detik" (planning)

Planning untuk episode 3D kedua. Belum ada yang dibangun. Dokumen ini mengunci cerita, shot, aset, suara, timing, dan cara pengecekan kualitas, supaya hasil akhirnya sesuai sebelum produksi dimulai.

Status: **Fase 6 selesai, video final jadi** (2026-11-11, voice baru): `out/ep02-3d_final.mp4`, 28,4 detik, 1080×1920, 22,8 MB (CRF 24), −14,4 LUFS, true peak −2,9 dB, whisper mendengar 100% naskah berurutan; laporan `out/ep02-3d_report.md`, lembar frame `out/ep02-3d_sheet.jpg`. Dibuat dengan `npm run produce -- ep02`. Limiter puncak di postprocess kini dipakai semua format (limit 0,7, attack 10 ms) karena AAC menambah overshoot. Fase 5: volume tiap kalimat VO disamakan ke −25 LUFS sebelum mix (loudness diukur dan disimpan di sidecar; `npm run vo-level -- ep02`, otomatis di `npm run tts`); SFX disintesis sendiri dengan ffmpeg (`npm run sfx`: ledakan, whoosh, dengung mesin, slam angka, pop teks), byte-identik tiap generate, dicatat di `public/audio/bgm/LICENSES.md`; waktu ledakan dan whoosh dibaca dari kurva yang sama dengan gambar (`soundCues` di halaman 3D), suara teks memakai cue teks. Fase 4: callout dengan garis penunjuk dari "BUSI AUS" ke ujung busi aus dan dari "KERAK KARBON" ke kepala piston kotor (posisi layar dihitung halaman 3D lewat `anchorsAt`, garis bergantian mengikuti kata VO supaya tidak bersilangan); caption di atas kotak hitam per kata (kata merah terbaca di atas mobil dan baju merah); catatan "±3.000 rpm, 4 silinder" di blok hitam; satuan "PER DETIK" seragam; badge dada mekanik utuh; mekanik di kanan frame CTA; noda lampu rim di lantai bengkel hilang; semua teks dicek di dalam safe area. Fase 3: keluar-masuk mesin memakai dissolve dua gambar utuh (mesin X-ray dan mobil di jalan), bukan material tembus pandang; perbandingan ke dashboard memakai crossfade 0,4 detik; shot perbandingan menampilkan unit utuh dengan dorong pelan; dashboard diperbaiki (bodi dashboard tidak lagi menutupi gauge) dan diframing dekat; kamera diam diberi gerak halus pelan. Fase 2: Aset detail terpasang: mesin 4 silinder (`public/previz/engine-unit.js`: piston dengan ring, batang piston I-beam, poros engkol dengan bandul, 4 katup per silinder dengan pegas dan nok, busi lengkap, api shader dengan percikan), bloom (`postfx.js`), speedometer di dashboard, mekanik dengan jari dan badge Doktermobil, kaca mobil gelap. Lembar aset: `npm run lookdev` ke `out/lookdev/`. Draft film: `npm run render -- ep02 --draft`. Naskah terkunci di `data/episodes/ep02.json`. Default: model mobil dan karakter buatan kode, tanpa BGM sampai ada lagu berlisensi. Lima klaim teknis masih `reviewed: false`.

Sebelum publish: lima klaim teknis dicek teknisi (`reviewed: false`), pastikan paket ElevenLabs komersial; BGM opsional (perlu lagu berlisensi).

---

## 1. Topik

**Fakta yang jarang diketahui:** saat mobil melaju di tol, di dalam mesinnya terjadi sekitar **100 pembakaran ("ledakan kecil") setiap detik**, hanya beberapa puluh sentimeter di depan kaki pengemudi.

Hitungannya, untuk mesin 4 silinder di ±3.000 rpm:

- 3.000 putaran per menit = 50 putaran per detik.
- Tiap silinder membakar sekali per 2 putaran = 25 kali per detik.
- 4 silinder × 25 = **100 kali per detik**.

Kenapa topik ini:

- **Jarang diketahui tapi dekat.** Semua orang menyetir, hampir tidak ada yang tahu angkanya.
- **Hook visual kuat.** Frame pertama bisa langsung berupa ledakan di ruang bakar.
- **Hanya 3D yang bisa menunjukkannya.** Tidak ada kamera yang bisa merekam isi silinder mobil harian.
- **Nyambung ke layanan Doktermobil.** Busi aus dan kerak karbon melemahkan pembakaran, dan itu yang dibereskan saat tune up.

Topik cadangan kalau yang ini tidak cocok:

| Topik | Fakta inti | Catatan |
|---|---|---|
| Ban punya tanggal produksi | Kode 4 digit di dinding ban = minggu dan tahun produksi; karet menua walau alur masih tebal | Visual kuat, tapi bukan layanan utama Doktermobil |
| Filter kabin | Mobil punya filter udara kedua untuk kabin yang hampir tidak pernah diganti | Paling dekat ke layanan AC, hook visualnya lebih lemah |

## 2. Spesifikasi

| Item | Nilai |
|---|---|
| Format | 1080×1920, 30 fps, H.264 + AAC |
| Durasi | Target 26–28 detik (wajib > 20, batas atas 30). Durasi akhir mengikuti panjang VO |
| Loudness | −14 LUFS, true peak ≤ −1,5 dB |
| Label seri | "JARANG DIKETAHUI" (bukan "Mitos atau Fakta?", karena episode ini tidak membantah mitos) |
| Bahasa | VO dan teks layar: Bahasa Indonesia santai. Kode dan komentar: Inggris |

## 3. Naskah VO

Target 53 kata (CTA dipendekkan setelah VO pertama terukur 27,4 detik, terlalu dekat ke batas 30 detik). EP01 berjalan sekitar 2,1 kata per detik, jadi VO kira-kira 26–27 detik.

| # | Beat | VO | Kata |
|---|---|---|---|
| 1 | Hook | "Ledakan ini terjadi seratus kali per detik, tepat di depan kakimu." | 11 |
| 2 | Reveal | "Itu mesin mobilmu saat melaju di tol." | 7 |
| 3 | Cara kerja | "Empat silinder bergantian: isap, kompresi, usaha, buang. Tiap busi memercik dua puluh lima kali per detik." | 16 |
| 4 | Kenapa penting | "Kalau busi aus atau ruang bakar berkerak, ledakannya melemah. Tarikan berat, bensin boros." | 13 |
| 5 | CTA | "Simpan video ini, dan follow Doktermobil." | 6 |

Kalau total VO melewati 28 detik, kalimat kedua di beat 3 dipendekkan, bukan dipercepat.

### Teks layar

| Beat | Teks | Catatan |
|---|---|---|
| 1 | "100×" besar, lalu "PER DETIK" | Muncul tepat di kata "seratus" |
| 1 | Label kecil "JARANG DIKETAHUI" | Tag seri |
| 2 | "MESIN MOBILMU" + catatan kecil "±3.000 rpm, 4 silinder" | Catatan kecil menjaga klaim tetap akurat |
| 3 | "ISAP", "KOMPRESI", "USAHA", "BUANG" | Satu per satu, tepat di tiap kata |
| 3 | "25× per detik" di busi + tag "SLOW MOTION" | Tag menjelaskan kenapa gerak terlihat pelan |
| 4 | "BUSI AUS", "KERAK KARBON" lalu "TARIKAN BERAT", "BENSIN BOROS" | Perbandingan bersih vs kotor |
| 5 | "SAVE", "Follow @doktermobil", logo | Sama dengan pola EP01 |

### Klaim yang harus dicek teknisi sebelum produksi

1. Angka 100 pembakaran per detik pada 4 silinder di ±3.000 rpm (hitungan di bagian 1).
2. ±3.000 rpm sebagai putaran mesin wajar saat melaju di tol.
3. Kata "ledakan": secara teknis ini pembakaran terkendali. Naskah memakai "ledakan" sebagai bahasa awam; teknisi memutuskan apakah perlu diganti.
4. Urutan langkah "isap, kompresi, usaha, buang" dan urutan pengapian 1-3-4-2.
5. Busi aus dan kerak karbon menyebabkan tarikan berat dan boros bensin.

## 4. Alur cerita dan shot

Cerita satu kalimat: kita mulai **di dalam** ledakan, mundur keluar sampai terlihat itu mobil biasa yang melaju tenang, masuk lagi untuk melihat cara kerjanya, melihat apa yang terjadi kalau komponennya kotor, lalu ditutup di bengkel.

| Shot | Beat | Isi | Kamera | Set |
|---|---|---|---|---|
| 1A | Hook | Gelap. Busi memercik, bola api menyebar di ruang bakar, piston terdorong turun | Makro, dorong pelan ke arah busi | Ruang bakar |
| 1B | Hook | Ledakan berulang makin cepat, "100×" masuk | Tarik mundur menembus dinding silinder | Ruang bakar → mesin X-ray |
| 2A | Reveal | Empat silinder menyala bergantian di dalam blok mesin tembus pandang | Tarik mundur terus, keluar dari kap mesin | Mesin X-ray |
| 2B | Reveal | Mobil merah melaju tenang di tol, pengemudi santai | Kamera samping mengikuti mobil | Jalan tol |
| 3A | Cara kerja | Satu silinder dipotong: katup membuka, piston turun, naik, busi memercik, turun, buang | Orbit pelan 30°, slow motion | Mesin X-ray |
| 3B | Cara kerja | Empat silinder lagi, urutan nyala 1-3-4-2, "25× per detik" di busi | Geser sepanjang mesin | Mesin X-ray |
| 4A | Kenapa penting | Dua silinder berdampingan: kiri bersih (api penuh), kanan busi aus dan piston berkerak (api kecil, tidak merata) | Statis, sedikit dorong | Meja perbandingan |
| 4B | Kenapa penting | Jarum tenaga turun, jarum bensin turun lebih cepat | Dekat ke dashboard | Dashboard (pakai ulang EP01) |
| 5 | CTA | Mekanik Doktermobil memegang busi baru, jempol, logo | Dorong pelan | Workshop (pakai ulang EP01) |

Transisi antar shot dibuat menyambung lewat gerak kamera (tarik mundur dan dorong masuk), bukan cut keras, kecuali ke shot 4A dan 5.

## 5. Aset

### Dibuat baru

| Aset | Detail yang dikejar |
|---|---|
| Ruang bakar (makro) | Elektroda busi dengan celah, dua katup, kubah ruang bakar, kepala piston dengan cekungan katup, bola api bergradasi putih-kuning-oranye dengan bloom |
| Mesin X-ray 4 silinder | Blok tembus pandang seperti kaca, 4 piston dengan ring, batang piston, poros engkol dengan bandul, poros nok, 8 katup dengan pegas, 4 busi, gerak kinematika engkol yang benar |
| Jalan tol | Aspal foto (Poly Haven), marka putus-putus, pembatas beton, lampu jalan, langit HDRI, pepohonan jauh |
| Meja perbandingan | Dua silinder potong di atas alas gelap; versi kotor punya tekstur kerak karbon dan elektroda busi aus |
| Busi (close-up) | Insulator keramik putih, ulir logam, mur segi enam, elektroda; dipakai di shot 4A dan 5 |

### Dipakai ulang dari EP01

Mobil, dashboard, workshop, mekanik, HDRI langit dan bengkel, tekstur aspal dan beton, perkakas hasil scan.

### Karakter dan mobil

Belum ada file model di `public/assets/models/`. Cerita ini sengaja menjadikan **mesin** sebagai bintang, jadi manusia hanya muncul sekilas (pengemudi di balik kaca, mekanik di CTA). Dua jalur:

- **Kamu sediakan GLB** mobil dan karakter sesuai `docs/3d-assets.md`: hasil paling realistis.
- **Tanpa GLB:** model buatan kode ditingkatkan (jari tangan, wajah lebih halus, seragam berlogo, mobil dengan panel dan lampu lebih detail). Lebih rapi dari EP01, tapi tetap bergaya stylized, bukan fotorealistis.

## 6. Gambar: tajam, halus, warna kencang

| Aspek | Cara |
|---|---|
| Ketajaman | Render internal 2160×3840 lalu diperkecil ke 1080×1920; tekstur 2K dengan anisotropic 16×; bayangan 4096 |
| Gerak halus | Motion blur 8 sub-frame per frame (EP01: 5); semua gerak kamera pakai kurva ease, tidak ada gerak linear atau patah |
| Mesin tidak "strobo" | Mesin asli berputar 50 kali per detik, mustahil ditampilkan di 30 fps. Gerak mesin ditampilkan slow motion dengan tag "SLOW MOTION" |
| Warna | Semua warna dikonversi sRGB→linear, tone mapping ACES, lalu grading kontras dan saturasi per set |
| Palet | Api oranye-kuning melawan logam biru-baja (kontras komplementer), merah brand untuk sorotan dan mobil |
| Cahaya | HDRI asli untuk pantulan, satu key light keras per set, rim light untuk memisahkan objek dari latar |
| Efek | Bloom untuk percikan dan api, depth of field tipis di shot makro |
| Encode | Master CRF 16, tag warna bt709, lalu `postprocess` menyesuaikan ukuran file |

Teks layar, callout, dan caption dirender sebagai komponen React di atas scene 3D (bukan di dalam halaman 3D seperti EP01), supaya tepinya tajam dan pasti berada di dalam safe zone.

## 7. Suara

| Lapisan | Rencana |
|---|---|
| VO | ElevenLabs, voice yang sama dengan EP01, model `eleven_multilingual_v2`, dengan timestamp per kata |
| SFX | Dibuat sendiri dengan sintesis (ffmpeg), jadi bebas lisensi: percikan busi, dentum rendah tiap ledakan slow motion, whoosh saat kamera menembus dinding, dengung mesin, tik counter, pop teks |
| BGM | Butuh satu lagu berlisensi komersial. Belum ada file. Lihat keputusan di bagian 12 |
| Mix | VO paling depan; BGM turun otomatis saat VO bicara; SFX di bawah VO; hasil akhir −14 LUFS |

Semua file audio pihak ketiga dicatat di `public/audio/bgm/LICENSES.md`.

## 8. Timing: tidak telat, tidak kecepatan

Aturan utamanya: **tidak ada waktu yang ditulis manual**. Semua mengikuti VO.

1. Durasi tiap beat dihitung dari file VO-nya (sudah berjalan di EP01).
2. Setiap kejadian visual diikat ke **kata** di VO, bukan ke detik. Contoh: "100×" muncul di kata "seratus"; label "ISAP", "KOMPRESI", "USAHA", "BUANG" muncul di katanya masing-masing; api melemah di kata "melemah".
3. Waktu tiap kata diambil dari timestamp ElevenLabs. Kalau VO di-generate ulang, semua cue ikut bergeser otomatis.
4. SFX ditempel ke cue yang sama dengan visualnya, jadi suara dan gambar selalu jatuh di frame yang sama.
5. Toleransi: maksimal 1 frame (33 ms) antara kata dan kejadian visualnya.

Pengecekan:

- Test otomatis: setiap cue punya kata yang benar-benar ada di VO.
- Animatic (lihat fase 1) untuk mengecek tempo sebelum aset detail dibuat.
- Audio final ditranskrip ulang dengan whisper dan dicocokkan kata per kata dengan naskah.

## 9. Tanpa typo, tanpa aset setengah jadi

**Teks:**

- Semua teks layar dan VO hanya ada di `data/episodes/ep02.json`, tervalidasi schema. Tidak ada teks yang ditulis di dalam komponen atau halaman 3D.
- Test otomatis: caption = naskah VO kata per kata; angka di layar cocok dengan angka di VO.
- Setiap kartu teks dicek dari crop frame resolusi penuh, satu per satu, sebelum render final.

**Aset dan render:**

- Lembar cek per set (diam dan berputar) sebelum animasi: tidak ada tembus antar objek, tepi bergerigi, tekstur buram, atau bayangan bocor.
- Lembar frame per shot dari render final, plus crop 100% di area detail.
- Semua teks di dalam safe zone Instagram (dicek dengan overlay).
- Render dua kali untuk satu frame acak: hasil harus identik (tidak ada elemen acak).
- QA otomatis: resolusi, durasi 20–30 detik, codec, loudness, ukuran file.

## 10. Tahapan kerja

Setiap fase berhenti untuk kamu cek sebelum lanjut.

| Fase | Isi | Yang kamu terima |
|---|---|---|
| 0 | Kunci naskah dan klaim (cek teknisi) | Naskah final di `ep02.json` |
| 1 | Generate VO, kunci timing, bangun animatic kotak abu-abu dengan kamera dan teks | Video animatic + VO untuk cek tempo dan cerita |
| 2 | Bangun aset per set | Lembar gambar tiap set dan aset |
| 3 | Animasi mesin, api, kamera, transisi | Render tanpa teks |
| 4 | Teks layar, callout, caption (lapisan React) | Render dengan teks |
| 5 | SFX, BGM, mix | Render dengan suara lengkap |
| 6 | Render final, QA, kompres | `out/ep02-3d_final.mp4` + laporan QA |

## 11. Perubahan teknis

- Composition baru untuk format "Jarang Diketahui" dengan schema sendiri (beat: hook, reveal, cara kerja, dampak, CTA) dan daftar cue per kata.
- Halaman 3D baru `public/previz/ep02-3d.html` yang memakai ulang pembangun aset EP01, hanya berisi scene (tanpa teks), dan mengekspos posisi layar titik-titik penting untuk callout.
- EP01 tidak diubah.

## 12. Keputusan yang dibutuhkan

1. **Topik:** "100 Ledakan per Detik", atau salah satu cadangan di bagian 1?
2. **Mobil dan karakter:** kamu sediakan GLB, atau pakai model buatan kode yang ditingkatkan?
3. **BGM:** kamu kirim file lagunya, saya carikan lagu CC0 untuk kamu setujui, atau tanpa BGM (VO + SFX saja)?
4. **Cek teknisi:** lima klaim di bagian 3 perlu disetujui sebelum VO di-generate.
