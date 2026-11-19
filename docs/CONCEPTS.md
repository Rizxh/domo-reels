# Dua pilihan konsep video Doktermobil

Dua arah produksi yang sudah bisa dirender dari repo ini. Keduanya 1080x1920, 30 fps, H.264 + AAC, sekitar −14 LUFS.

| | A. Animasi 3D | B. Talking head + ilustrasi |
|---|---|---|
| Contoh | `out/ep01-3d_final.mp4` (EP01 "Panasin Mesin 15 Menit", 29,8 dtk) | `out/ko-lung-lung_final.mp4` (Tune Up Express Rp499 ribu, 22,4 dtk) |
| Cocok untuk | Edukasi "Mitos atau Fakta?", topik teknis yang sulit difilmkan | Promo layanan, pengumuman, konten yang butuh wajah dan kepercayaan |
| Bahan mentah | Naskah + VO ElevenLabs | Satu take video orang bicara ke kamera |
| Kekuatan | Semua bisa divisualkan (mesin, asap, suhu), konsisten antar episode | Terasa personal dan jujur, cepat diproduksi, cocok untuk penawaran harga |
| Risiko | Produksi scene 3D baru per topik masih manual (previz HTML) | Bergantung kualitas take (cahaya, audio, ekspresi) |
| Waktu per episode | Lama untuk topik baru (bikin scene), cepat kalau scene sudah ada | Cepat: transkrip, pilih cut, isi JSON ilustrasi, render |

## A. Animasi 3D

Previz three.js dijalankan di dalam Remotion dan timing-nya mengikuti VO ElevenLabs per beat (hook, mitos, fakta, kenapa, CTA). Caption kata per kata diambil dari timing ElevenLabs.

```bash
npm run render -- ep01 --3d
```

```bash
npm run postprocess -- ep01 --3d
```

## B. Talking head + ilustrasi

Alur editnya:

1. **Transkrip lokal** pakai whisper.cpp (tidak ada upload). Hasilnya timing per kata.
2. **Cut**: buang bagian yang lemah, lalu langsung buka di poin penting. Untuk take ini:
   - 18,9 detik awal dibuang: berdiri diam dengan noise latar.
   - Kalimat yang mengulang dibuang ("produk baru dari kami… kebutuhan express").
   - Jeda panjang sebelum "busi" dibuang.
   - Hitung mundur di akhir dibuang.

   Setiap titik cut diverifikasi dengan transkrip ulang, supaya tidak ada kata yang kepotong.
3. **Framing**: punch-in halus di wajah antar kalimat. Di titik cut, zoom berubah tegas supaya jump cut terasa disengaja.
4. **Ilustrasi** (semua digambar dengan SVG/CSS, digerakkan frame, tanpa stock atau AI image):
   - Judul "TUNE UP / EXPRESS" bergaya label blok yang terbuka dari kiri.
   - Price tag merah Rp499 ribu yang tergantung dan berayun sampai diam, dengan angka naik satu per satu.
   - Kartu cutaway mesin (piston bergerak mengikuti kinematika engkol, aliran udara di intake dan knalpot, busi menyala di titik mati atas). Intake, throttle, busi, kepala piston, dan katalitik menyala merah tepat saat disebut, dengan counter 0/5 → 5/5.
   - Pill "Klik link di bawah" dengan chevron berurutan.
   - End card logo, lalu "PASTI BERES" dengan centang yang tergambar.
5. **Caption** kata per kata. Caption otomatis minggir saat ilustrasi sedang membawa kata yang sama.

Semua data editnya ada di `data/talking-head/ko-lung-lung.json` (cut, framing, ilustrasi). Transkripnya di `ko-lung-lung.transcript.json`. Semua waktu memakai detik video mentah, jadi kalau cut diubah, ilustrasi tetap menempel ke ucapannya.

```bash
npm run transcribe -- "data/episodes/ko lung lung before.mp4" --range 18.93-31.8 --range 32.4-35.5 --range 42.38-48.7 --out data/talking-head/ko-lung-lung.transcript.json
```

```bash
npm run render -- ko-lung-lung --talking-head
```

```bash
npm run postprocess -- ko-lung-lung --talking-head
```

## Catatan sebelum posting

- Belum ada BGM/SFX berlisensi di kedua versi. File dan lisensinya dicatat di `public/audio/bgm/LICENSES.md`.
- Klaim teknis di kedua video tetap perlu dicek teknisi Doktermobil.
- Talking head: logo Doktermobil sudah memuat tulisan "PASTI BERES", jadi tagline besar di end card agak dobel. Boleh diganti teks lain kalau mau.
- Talking head: "klik link di bawah" lebih cocok untuk iklan atau Story dengan tombol link. Untuk Reels organik, tautannya biasanya ada di bio.
