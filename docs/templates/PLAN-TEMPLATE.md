# <ID>: "<Judul episode>" (planning)

Status: **menunggu persetujuan**. Setelah disetujui, produksi berjalan otomatis (`/buat-video`).

Format: Jarang Diketahui (3D) / Mitos atau Fakta (2D) / Talking head

---

## 1. Topik

**Fakta inti:** satu kalimat yang bikin orang berhenti scroll.

Hitungan atau sumber fakta (kalau ada angka, tulis cara dapatnya).

Kenapa topik ini:

- **Dekat dengan penonton:** ...
- **Hook visual:** apa yang terlihat di frame pertama.
- **Nyambung ke layanan Doktermobil:** ...

## 2. Spesifikasi

| Item | Nilai |
|---|---|
| Format | 1080×1920, 30 fps, H.264 + AAC |
| Durasi | Target 22–28 detik (mengikuti panjang VO, maksimal 30) |
| Loudness | −14 LUFS, true peak ≤ −1,5 dB |
| Label seri | ... |

## 3. Naskah VO

Bahasa Indonesia santai. Perkiraan durasi: jumlah kata ÷ 2,15 kata per detik.

| # | Beat | VO | Kata |
|---|---|---|---|
| 1 | Hook | "..." | |
| 2 | ... | "..." | |
| 5 | CTA | "Simpan video ini, dan follow Doktermobil." | 6 |

### Teks layar

Semua teks hanya ada di `data/episodes/<id>.json`. Setiap teks diikat ke kata di VO.

| Beat | Teks | Muncul di kata |
|---|---|---|
| 1 | ... | "..." |

### Klaim yang harus dicek teknisi

1. ...

## 4. Alur cerita dan shot

Cerita satu kalimat: ...

| Shot | Beat | Isi | Kamera | Set |
|---|---|---|---|---|
| 1 | Hook | ... | ... | ... |

## 5. Aset

| Aset | Sumber | Status |
|---|---|---|
| ... | Dipakai ulang / dibuat baru / dari user | |

## 6. Suara

| Lapisan | Rencana |
|---|---|
| VO | ElevenLabs, voice yang sama dengan episode sebelumnya |
| SFX | Disintesis (`npm run sfx`), bebas lisensi |
| BGM | Hanya lagu berlisensi komersial, dicatat di `public/audio/bgm/LICENSES.md` |

## 7. Risiko dan yang perlu manusia

- Klaim teknis di atas perlu dicek teknisi (`reviewed: false` sampai dicek).
- ...
