# EP13: "Mobil Kamu Bau Kambing" (diproduksi)

Status: **diproduksi 2026-11-23** (user memilih hook A dari `docs/toon/DRAFT-EP12-14.md`).

Format: Toon 3D, formula Hook emosional → Isi → STAR → CTA. Seri "Kasus Bengkel"; ceritanya ilustrasi dengan tokoh fiktif (Siska).

## Naskah (voice v3, 46,6 s)

| # | Bagian | VO |
|---|---|---|
| 1 | Hook | Mobil kamu bau kambing? Bisa jadi ada kebun jamur di balik dasbor. |
| 2 | Isi | Gara-garanya, bagian AC yang paling dingin justru yang paling lembap. |
| 3 | S | Siska tiap pagi berangkat kerja dengan AC nyala terus, lalu mesin langsung dimatikan begitu sampai. |
| 4 | T | Lama-lama, tiap AC dinyalakan keluar bau apek kayak kandang kambing, apalagi pas hujan. |
| 5 | A | Teknisi Doktermobil mengintip evaporator pakai kamera kecil. |
| 6 | A | Siripnya berlendir, penuh debu dan jamur. Filter kabinnya hitam, saluran airnya mampet. |
| 7 | R | Evaporator dibersihkan, filter diganti, saluran air dilancarkan. Udara dingin lagi, baunya hilang. |
| 8 | R (twist) | Jadi, bau kambing itu sebenarnya jamur yang ikut kamu hirup setiap hari. |
| 9 | Tip | Biar nggak balik lagi, matikan AC sebentar sebelum sampai, biarkan kipasnya mengeringkan evaporator. |
| 10 | CTA | AC mulai apek? Bersihkan AC-nya di Doktermobil, sebelum mobilmu resmi jadi kandang. |

## Shot

| Shot | Isi |
|---|---|
| hook | Kambing di kursi penumpang, Siska menutup hidung |
| tease | x-ray evaporator berjamur |
| isi | Embun dan uap dingin di sirip |
| commute | Siska menyetir pagi |
| park | Parkir lalu turun |
| task | Bau dari ventilasi, kambing muncul |
| rain | Malam, hujan |
| inspect | Mekanik dengan layar kamera inspeksi |
| fins | Sirip berjamur |
| filter | Filter kabin hitam |
| drain | Saluran air mampet |
| clean | Jamur hilang, filter baru, air menetes lagi |
| fresh | Siska lega, kambing hilang |
| twist | Spora |
| tipDrive | Siska menyetir sore |
| tipDry | Kipas mengeringkan evaporator |
| shop | Bengkel dengan papan logo Doktermobil asli, lalu kartu CTA di tengah |

## Kode

- Cerita: `src/toon/ac/` (`hvac.ts`: stage AC yang dibelah; `fx.ts`: kambing, gelombang bau, spora, hujan, layar kamera).
- Composition: `AcShort`.
- Audio: `scripts/toon/ep13-audio.ts`.

## Perlu manusia

- Klaim teknis di `data/episodes/ep13.json` (`reviewed: false`): penyebab bau apek, prosedur pembersihan, tip mengeringkan evaporator, gejala di kartu CTA.
- Konfirmasi bahwa Doktermobil memang memakai kamera inspeksi untuk evaporator.
