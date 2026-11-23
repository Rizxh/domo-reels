# <ID>: "<Judul episode>" (planning)

Status: **menunggu persetujuan**. Setelah disetujui, produksi berjalan otomatis (`/buat-toon`).

Format: **Toon 3D**, formula v2 (`docs/toon/FORMULA.md`): pola A (kasus/iklan: Hook → Problem → False Hope → Solusi → 3 Fitur → Hasil → CTA) atau pola B (fun fact: Hook → Isi → STAR → CTA).
Seri: Sejarah Otomotif / Fun Fact Otomotif / …

---

## 1. Topik

**Fakta inti (1 kalimat):** …

**Desire paling mendesak → premis:** …

**Jenis hook (Seven Deadly Hook):** positive / negative / question / experience / social proof / call out / how to; **teknik pengunci:** …

**Awareness level penonton:** unaware / problem aware / solution aware

**Jembatan ke hari ini:** komponen mobil penonton yang terhubung → layanan Doktermobil: …

| Fakta | Sumber (kuat) | Disebut di VO? |
|---|---|---|
| … | … | ya / tidak |

## 2. Spesifikasi

| Item | Nilai |
|---|---|
| Format | 1080×1920, 30 fps, H.264 + AAC |
| Durasi | 45–59 detik (maks 60), 125–155 kata |
| Voice | ElevenLabs `eleven_v3`, stability 0,5, similarity 0,9, tempo 1,15 |
| Loudness | −14 LUFS |
| Teks layar | Subtitle per kata (kata kunci merah), chip sumber, kartu CTA |

## 3. Naskah VO

**Pola A (kasus / iklan), 105–130 kata:**

| # | Bagian | VO (`vo.text`) | Tag v3 (`vo.tts`) | Kata |
|---|---|---|---|---|
| 1 | Hook | "<pengalaman memalukan / pertanyaan / call out>" | `[shocked]` `[laughs]` | |
| 2 | Problem | "<rasa sakit, kata pemicu>" | `[embarrassed]` | |
| 3 | False hope | "<sudah coba X, Y, tetap gagal>" | `[frustrated]` `[sighs]` | |
| 4 | Isi: letak | "Ternyata sumbernya ada di …" | `[curious]` | |
| 5 | Isi: kenapa | "<sebab-akibat sederhana>" | `[explaining]` | |
| 6 | Solusi | "Di Doktermobil, teknisi …" | `[confident]` | |
| 7 | 3 fitur | "<A>, <B>, <C>." | `[upbeat]` | |
| 8 | Hasil | "<kembali ke premis, payoff>" | `[happy]` | |
| 9 | CTA | "<gejala>? Langsung … di Doktermobil. Klik link di bio, karena di Doktermobil pasti beres!" | `[friendly]` `[excited]` | |

**Pola B (fun fact):**

| # | Bagian | VO (`vo.text`) | Tag v3 (`vo.tts`) | Kata |
|---|---|---|---|---|
| 1 | Hook | "…" | `[confident]` | |
| 2 | Isi | "Gara-garanya, …" | `[playful]` | |
| 3 | S | "Tahun …, …" | | |
| 4 | T | "…" | | |
| 5 | A | "…" | | |
| 6 | A | "…" | `[tense]` | |
| 7 | A | "Untungnya, … Sialnya, …" | `[deadpan]` | |
| 8 | R | "… dan lahirlah …" | `[proud]` | |
| 9 | R (twist) | "Jadi, …" | `[warmly]` | |
| 10 | Jembatan | "Sekarang, … Tapi tetap saja, …" | `[curious]` `[serious]` | |
| 11 | CTA | "<gejala>? Cek … di Doktermobil, sebelum <callback hook>." | `[friendly]` `[playful]` | |
| | | | **Total** | **125–155** |

`captionHighlight`: …

`cta`: line "Langsung … di Doktermobil", eyebrow "<GEJALA>?", button "KLIK LINK DI BIO", tagline "Spesialis AC & Tune Up · Pasti Beres", at "<kata pemicu kartu>"

### Rencana visual untuk awam

| Bagian teknis | Letak di mobil (x-ray) | Bentuk asli (aset detail, shot medium) | Cara kerja (animasi) | Label | Perbaikan Doktermobil (aksi) |
|---|---|---|---|---|---|
| … | | | | | |

### Klaim yang harus dicek teknisi

1. …

## 4. Alur shot

Cerita satu kalimat: …

| Shot | Scene | Isi gambar | Kamera | Cahaya | Cue kata |
|---|---|---|---|---|---|
| hook | 1 | aksi di frame pertama | push pelan | | |
| … | | | | | |
| modern | 10 | mobil modern di jalan kota (`modern.ts`) | low, lalu glide ke komponen | day | "Sekarang" |
| detail | 10 | close-up komponen modern (terbaca, bukan abstrak) | 3/4 | day | |
| shop | 11 | bengkel Doktermobil, mekanik + cameo tokoh, naik ke papan nama | 2 key | day | "Cek" |

## 5. Aset

| Aset | Sumber | Status |
|---|---|---|
| Engine toon (ink, lens blur, grade, cahaya, karakter kartu) | `src/toon/` | Dipakai ulang |
| Mobil modern, jalan kota, bengkel Doktermobil | `src/toon/benz/modern.ts` | Dipakai ulang |
| Set dan props cerita | prosedural di `src/toon/<story>/` | Baru |

## 6. Suara

VO v3, musik bed `soft-drive` (di-duck di bawah VO), SFX sintesis di beat (`scripts/toon/<id>-audio.ts`).

## 7. Risiko

- …
