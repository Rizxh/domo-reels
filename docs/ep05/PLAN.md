# EP05: "3 Tanda Bengkel Nakal" (planning)

Status: **video final jadi** (2026-11-17): `out/video/ep05 - 3 Tanda Bengkel Nakal.mp4`, 29,6 detik, −14,1 LUFS, true peak −2,8 dB, whisper 94% (selisih hanya ejaan: "tagian", "difonis"). Kit komponen di `src/paper/` (kit.tsx, props.tsx), papan di `src/paper/Board.tsx`, composition `Paper2D`. Caption: `docs/ep05/CAPTION.md`. Naskah final di `data/episodes/ep05.json` (kalimat 2, 3, 6 dipadatkan supaya di bawah 30 detik). Cover yang disarankan: frame detik 3,5.

Format baru: **2D papan tulis + kertas potong** (format `paper`). Satu papan tulis besar berlatar kertas hangat; kamera menggeser dan zoom dari panel ke panel (tidak ada layar kosong, tiap 2–3 detik ada gerak atau reveal). Aset dan scene dibuat sebagai komponen React yang bisa dipakai ulang di episode berikutnya (seri "jangan ketipu bengkel").

---

## 1. Topik

Episode pembuka seri: masalah umum dulu. **Tiga tanda bengkel nakal** yang sering bikin orang ketipu, lalu satu kebiasaan aman: minta estimasi tertulis sebelum dikerjakan, dan cek mobil di bengkel yang transparan.

- **Hook cerita:** "Niatnya cuma ganti oli, pulang-pulang tagihannya tiga juta." Relatable, langsung bikin penasaran "kok bisa?".
- **Penasaran sampai akhir:** dijanjikan 3 tanda, dibuka satu per satu (counter 1/3, 2/3, 3/3), solusinya di akhir.
- **Tidak menyebut atau menyindir bengkel tertentu.** Semua contoh umum.

## 2. Spesifikasi

| Item | Nilai |
|---|---|
| Format | 1080×1920, 30 fps, H.264 + AAC |
| Durasi | Target 26–29 detik (maksimal 30) |
| Loudness | −14 LUFS, true peak ≤ −1,5 dB |
| Label seri | JANGAN KETIPU BENGKEL |
| Output | `out/video/ep05 - 3 Tanda Bengkel Nakal.mp4` |

## 3. Naskah VO (kalimat utuh, intonasi bercerita)

56 kata, sekitar 26 detik. Tempo dicek per kalimat 2,0–2,4 kata/detik (pelajaran EP03).

| # | Beat | VO | Kata |
|---|---|---|---|
| 1 | Hook | "Niatnya cuma ganti oli, pulang-pulang tagihannya tiga juta." | 8 |
| 2 | Janji | "Biar nggak kejadian, kenali tiga tanda bengkel nakal." | 8 |
| 3 | Tanda 1 | "Pertama, langsung divonis rusak parah, tapi bagiannya nggak ditunjukin." | 9 |
| 4 | Tanda 2 | "Kedua, harganya nggak jelas dari awal, tahu-tahu tagihan membengkak." | 9 |
| 5 | Tanda 3 | "Ketiga, part diganti tanpa izin, part lamanya nggak dikembalikan." | 9 |
| 6 | Solusi + CTA | "Minta estimasi tertulis dulu, dan cek mobilmu di bengkel yang transparan, seperti Doktermobil." | 13 |

## 4. Storyboard (setiap kalimat punya visual sendiri)

| # | Kalimat | Visual (kertas potong di papan tulis) | Kamera |
|---|---|---|---|
| 1a | "Niatnya cuma ganti oli" | Mobil kertas merah meluncur masuk, sticky note kuning "GANTI OLI" ditempel | Close, geser ikut mobil |
| 1b | "pulang-pulang tagihannya tiga juta" | Nota kertas keluar memanjang terus, angka **Rp3.000.000** ditulis spidol merah; pengemudi kaget (mata membesar, keringat) | Tilt turun ikuti nota |
| 2 | "kenali tiga tanda bengkel nakal" | Spidol menulis **3 TANDA BENGKEL NAKAL**, garis bawah merah tergambar, ikon kaca pembesar kertas | Zoom out ke judul |
| 3 | Tanda 1 | Montir kertas menunjuk kap mobil, balon kata "RUSAK PARAH!"; kap tertutup tirai kertas dengan tanda tanya; nomor 1 dilingkari spidol | Pan ke panel 1, punch in di tirai |
| 4 | Tanda 2 | Label harga "?" lalu nota menggembung seperti balon, angka berputar naik; nomor 2 | Pan ke panel 2, zoom ke nota |
| 5 | Tanda 3 | Tangan kertas menukar part (busi) saat pengemudi menoleh, part lama dilempar ke tong; stempel merah "TANPA IZIN"; nomor 3 | Pan ke panel 3 |
| 6a | "Minta estimasi tertulis dulu" | Clipboard "ESTIMASI" dengan checklist dicentang satu per satu, tanda tangan | Zoom ke clipboard |
| 6b | "bengkel yang transparan, seperti Doktermobil" | Zoom out: seluruh papan terlihat (3 panel dicoret hijau = sudah tahu), sticky note logo Doktermobil + "Booking cek mobil" | Pull back lebar |

Gaya: kertas krem bertekstur halus, tepi kertas sedikit sobek, bayangan lembut, spidol hitam/merah yang tergambar per frame, palet merah brand + kuning sticky note + biru tinta. Teks besar Anton, catatan tangan Poppins. Tidak pakai pola "ikon dalam lingkaran berwarna" atau garis aksen di atas.

## 5. Suara

| Lapisan | Rencana |
|---|---|
| VO | ElevenLabs (voice yang sama), kalimat utuh, tempo dicek |
| Musik | Orisinal (`npm run music -- ep05`): ukulele/pluck ringan, playful, nada cerah |
| SFX | Disintesis: gesekan spidol, tempel kertas, pop, stempel, kertas sobek |

## 6. Klaim yang perlu dicek

1. Tiga tanda bengkel nakal ini adalah praktik umum yang merugikan konsumen (tidak menuduh bengkel tertentu).
2. Saran minta estimasi tertulis sebelum pekerjaan dimulai dan minta part lama dikembalikan.
3. Doktermobil disebut sebagai bengkel yang transparan: apakah Doktermobil memang memberi estimasi tertulis, menunjukkan bagian rusak, dan mengembalikan part lama? Kalau belum pasti, kalimat terakhir diganti netral ("cek mobilmu di bengkel terpercaya, misalnya Doktermobil").
4. Contoh tagihan Rp3 juta hanya ilustrasi.
