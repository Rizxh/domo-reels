# EP07: "Rem Bisa Hilang di Turunan" (produced)

Format: **Cinema** (`format: "cinema"`), world baru `brake` (`src/cinema/worlds/brake/`).
Target: 1080x1920, 30 fps, ±26 detik, H.264 + AAC.

Hasil akhir: `out/video/ep07 - Rem Bisa Hilang di Turunan.mp4` — 28,00 detik,
1080x1920, 18,4 MB, -14,1 LUFS, true peak -2,2 dB. Semua cek QA lolos.
Whisper 96% ("cakram" terdengar "cekram" — artefak ASR, bukan kata hilang).

## 1. Topik

Brake fade: rem yang justru melemah saat paling dibutuhkan, yaitu di turunan
panjang. Audiens diajak lihat apa yang terjadi di dalam rem (cakram memerah,
kampas jadi licin) lalu diberi solusi praktis (engine brake, turunkan gigi).

Angle: bukan "rem blong" (panik, salah kaprah), tapi "rem memudar karena panas".
Ini yang bikin hook-nya jujur sekaligus mengejutkan.

## 2. Spesifikasi

| Item | Nilai |
|---|---|
| id | `ep07` |
| format | `cinema` |
| world | `brake` (baru) |
| durasi naskah | 55 kata, ±26 detik pada 2,15 kata/detik |
| beat | 6 (hook, fade, heat, feel, fix, cta) |
| shot | 17, potong tiap 1,5–2 detik, semua cut jatuh di kata cue |
| teks layar | judul, callout, label, handle (semua di safe area) |
| VO | ElevenLabs, kunci di `.env` |

## 3. Naskah VO

| Beat | VO | Kata |
|---|---|---|
| hook | Turunan panjang, rem bisa hilang justru saat paling dibutuhkan. | 9 |
| fade | Namanya brake fade. Kampas dan cakram kepanasan, cengkeraman turun. | 9 |
| heat | Gesekan terus menerus bikin cakram memerah dan kampas jadi licin. | 10 |
| feel | Pedal terasa dalam, mobil tetap melaju, rem tak lagi menggigit. | 10 |
| fix | Pakai engine brake, turunkan gigi, jangan injak rem terus. | 9 |
| cta | Cek rem di Doktermobil. Cek dulu, baru kerja. | 8 |

### Teks layar

| Beat | Cue | Teks | Gaya |
|---|---|---|---|
| hook | hilang | REM BISA HILANG | title |
| hook | dibutuhkan | SAAT PALING DIBUTUHKAN (accent) | title |
| fade | fade | BRAKE FADE | title |
| fade | Kampas | KAMPAS PANAS → anchor `pad` | callout |
| fade | cakram | CAKRAM MEMBARA → anchor `discFace` | callout |
| fade | cengkeraman | CENGKERAMAN TURUN (accent) | label |
| heat | memerah | CAKRAM MEMERAH → anchor `discFace` | callout |
| heat | licin | KAMPAS JADI LICIN → anchor `pad` (accent) | callout |
| feel | dalam | PEDAL TERASA DALAM | label |
| feel | melaju | MOBIL TETAP MELAJU | label |
| feel | menggigit | REM TAK LAGI MENGGIGIT (accent) | title |
| fix | engine | ENGINE BRAKE | label |
| fix | turunkan | TURUNKAN GIGI | label |
| fix | jangan | JANGAN INJAK TERUS (accent) | label |
| cta | Cek (#1) | CEK REM SEBELUM JALAN | title |
| cta | Doktermobil | Booking sekarang | handle |

### Klaim yang harus dicek teknisi

1. Brake fade = cakram dan kampas terlalu panas → gesekan turun, pedal terasa dalam.
2. Cakram bisa membara (memerah) pada pengereman berat berulang.
3. Kampas yang terlalu panas bisa mengeras/mengkilap (glazing) → tidak menggigit.
4. Engine brake (turunkan gigi) memperlambat tanpa memanaskan rem berlebihan.

Semua ditandai `reviewed: false` di `data/episodes/ep07.json`. Tidak ada angka
harga atau angka suhu di layar, jadi tidak ada klaim numerik yang perlu
diverifikasi.

## 4. Alur cerita dan shot

| # | Shot | Cut pada | Isi |
|---|---|---|---|
| 1 | wide reveal | awal | Assembling rem di studio gelap, dolly pelan |
| 2 | rotor face | `justru` | Makro permukaan cakram berputar |
| 3 | caliper | `fade` | Kaliper merah memangku tepi cakram |
| 4 | pad macro | `Kampas` | Kampas menekan, panas mulai |
| 5 | disc glow | `cakram` | Cakram mulai berpijar |
| 6 | heat pullback | `cengkeraman` | Menjauh, panas terlihat menyebar |
| 7 | friction macro | `Gesekan` | Makro gesekan, cahaya menyapu |
| 8 | blazing hero | `memerah` | Cakram merah menyala, bloom penuh |
| 9 | glazed pad | `licin` | Kampas mengkilap seperti kaca |
| 10 | wide fade | `dalam` | Wide, rem memudar |
| 11 | smoke wide | `melaju` | Asap naik dari kampas |
| 12 | top down | `menggigit` | Pandangan atas, rem tak menggigit |
| 13 | side profile | `engine` | Profil samping: ketebalan cakram |
| 14 | low angle | `turunkan` | Low angle, solusi terasa heroic |
| 15 | hero turn | `jangan` | Orbit pelan |
| 16 | cta | `Cek` | Hero untuk CTA |
| 17 | macro loop | `baru` | Kembali ke makro (loop ke hook) |

Semua cut dihitung dari frame kata cue, bukan angka hardcode.

## 5. Aset

- Geometri 100% prosedural (R3F): cakram berventilasi, bell, hub + 5 baut,
  kaliper merah, dua kampas, asap partikel. Tidak ada file model atau tekstur
  baru, jadi tidak ada lisensi pihak ketiga yang perlu dicatat.
- Look: studio gelap, 6 light panel, bloom threshold 0.68 supaya cakram panas
  benar-benar menyala. Ramp emissive: steel → cherry → red → orange → white hot.
- Music: `npm run music -- ep07` (sintesis sendiri, tanpa lisensi pihak ketiga).

## 6. Suara

| Momen | SFX |
|---|---|
| reveal | boom |
| masuk shot 2 | whoosh |
| kampas menggigit | slam + crackle |
| panas naik | hiss (loop sampai `memerah`) |
| cakram memerah | boom + slam |
| pull back | whoosh |
| solusi | whoosh |
| CTA | bell |

VO 1.0, SFX mengikuti `SFX_MIX`, musik ducking di bawah VO (sudah diatur
`Cinema3D`).

## 7. Risiko dan yang perlu manusia

1. **Klaim teknis** — 4 klaim di atas belum dicek teknisi Doktermobil.
2. **Akurasi visual** — proporsi cakram/kaliper dibuat realistis tapi bukan
   replika part tertentu; aman untuk edukasi, bukan untuk klaim spesifikasi.
3. **"Rem blong" vs "brake fade"** — naskah sengaja membedakan keduanya. Kalau
   tim ingin angle "rem blong", hook harus diubah.
4. **BGM** — file ep07 belum ada sampai `npm run music -- ep07` dijalankan.
5. **VO** — butuh `ELEVENLABS_API_KEY` dan `ELEVENLABS_VOICE_ID` di `.env`
   (sudah terisi); kredit ElevenLabs perlu dipantau.
