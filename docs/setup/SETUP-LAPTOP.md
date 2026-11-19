# Setup laptop untuk produksi video Doktermobil

Panduan untuk menyiapkan laptop baru (misalnya laptop manager) supaya bisa membuat Reels dengan satu prompt: `/buat-video <topik>`.

## 1. Yang harus ada

| Kebutuhan | Keterangan |
|---|---|
| Windows 10/11 atau macOS, RAM 16 GB+ | Render 3D memakai WebGL; GPU dedicated jauh lebih cepat |
| [Node.js LTS](https://nodejs.org) versi 20 ke atas | Cek: `node -v` |
| [Git](https://git-scm.com) | Untuk mengambil proyek |
| [ffmpeg](https://ffmpeg.org/download.html) | Harus bisa dipanggil dari terminal. Cek: `ffmpeg -version` |
| Claude Code (aplikasi desktop atau CLI) | Login dengan akun Claude. Untuk 3D, paket Max lebih realistis daripada Pro |
| Akun ElevenLabs berbayar | Paket gratis tidak boleh untuk konten komersial |
| Lisensi Remotion | Gratis untuk individu dan perusahaan maks. 3 karyawan; di atas itu perlu Company License (remotion.dev/license) |

Chrome untuk render diunduh otomatis oleh Remotion saat render pertama.

## 2. Ambil proyek dan install

```bash
git clone <url-repo-private> domo-reels
cd domo-reels
npm install
npm run assets
npm run sfx
```

`npm run assets` mengunduh tekstur dan HDRI Poly Haven (CC0, sekitar 100 MB). `npm run sfx` membuat efek suara.

## 3. Isi kunci ElevenLabs

Salin `.env.example` menjadi `.env`, lalu isi sendiri:

```
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
```

Jangan pernah menempel kunci ini di chat Claude atau di file lain. `.env` tidak ikut ke Git.

## 4. Izinkan perintah proyek tanpa konfirmasi

Supaya Claude tidak minta "enter" untuk setiap render atau ffmpeg, salin `docs/setup/claude-settings.example.json` menjadi `.claude/settings.json` di folder proyek. Isinya:

- **Diizinkan:** `npm run`, `npm test`, cek kode, Remotion, ffmpeg, dan edit file di folder kode dan data proyek.
- **Diblokir:** membaca `.env` dan `git push`.

Claude tidak boleh menulis file ini sendiri, jadi harus disalin manual.

## 5. Cek semuanya jalan

```bash
npm test
npm run produce -- ep02 --draft
```

Kalau berhasil, ada `out/produce/ep02-3d_draft.mp4`, `out/qc/ep02-3d_draft_sheet.jpg`, dan `out/qc/ep02-3d_draft_report.md`.

## 6. Cara pakai sehari-hari

Buka folder proyek di Claude Code, lalu tulis:

```
/buat-video topik: kenapa ban harus dirotasi tiap 10.000 km
```

1. Claude menyusun planning (naskah, teks layar, klaim teknis, shot) di `docs/<id>/PLAN.md` dan bertanya satu kali: setuju atau revisi.
2. Setelah disetujui, semuanya berjalan sendiri: VO ElevenLabs, penyamaan volume, SFX, render draft, cek mandiri, render final, normalisasi audio, dan laporan QA.
3. Hasil akhir: `out/video/<id> - <judul>.mp4`, lembar frame dan laporan QA di `out/qc/`.

Claude hanya berhenti di tengah kalau kunci atau kredit ElevenLabs habis, ada cek yang tetap gagal setelah 3 kali diperbaiki, atau ada keputusan yang harus manusia ambil (lisensi, ganti topik).

## 7. Perintah manual (kalau perlu)

| Perintah | Fungsi |
|---|---|
| `npm run produce -- <id>` | Seluruh pipeline sampai file final + laporan QA |
| `npm run produce -- <id> --draft` | Draft setengah resolusi untuk cek cepat (3D) |
| `npm run produce -- <id> --from render` | Lanjut dari langkah tertentu (tts, vo-level, sfx, render, postprocess, verify) |
| `npm run tts -- <id>` | Generate VO (hanya kalimat yang berubah) |
| `npm run lookdev` | Lembar aset 3D |
| `npm run studio` | Preview di Remotion Studio |
