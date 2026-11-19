# Aset 3D untuk versi animasi

## Sudah terpasang (CC0, Poly Haven)

Download ulang dengan `npm run assets`. Semua file masuk ke `public/assets/polyhaven/` (di-gitignore) dan daftarnya tercatat di `LICENSES.md` folder itu. Lisensinya CC0: boleh dipakai komersial tanpa atribusi.

| Aset | Dipakai di |
|---|---|
| HDRI `kloofendal_48d_partly_cloudy_puresky` | Langit berawan sebagai background, plus cahaya dan pantulan di set carport dan jalan |
| HDRI `autoshop_01` | Pantulan di set workshop |
| Tekstur `asphalt_02`, `concrete_floor_02`, `clay_roof_tiles` | Jalan, carport, lantai ruang mesin, genteng |
| Normal map `white_plaster_02` | Relief dinding rumah |
| Model `potted_plant_01/02`, `shrub_01/02` | Tanaman di depan rumah |
| Model `metal_tool_chest`, `tool_cart`, `tire_pump` | Perlengkapan workshop |

## Yang perlu disediakan: mobil dan karakter realistis

Model mobil dan manusia yang realistis tidak tersedia gratis dengan lisensi CC0. Beli atau download sendiri, misalnya dari CGTrader, TurboSquid, Fab, atau Sketchfab, lalu taruh di `public/assets/models/`. Pastikan lisensinya mengizinkan pemakaian komersial di video. CC-BY boleh, asal atribusinya kita cantumkan.

### Mobil (`car.glb`)

- **Format:** GLB/glTF 2.0, skala meter asli, dengan depan mobil menghadap sumbu +X atau +Z.
- **Ukuran:** maksimal 100 ribu segitiga, tekstur PBR maksimal 2K.
- **Node terpisah dengan nama jelas:**
  - 4 roda (`wheel_FL`, `wheel_FR`, `wheel_RL`, `wheel_RR`), dengan pivot di tengah roda.
  - Pintu sopir (`door_FL`), dengan pivot di engsel.
- **Material:** kaca memakai material sendiri, terpisah dari bodi.
- **Tipe:** idealnya MPV atau hatchback yang umum di Indonesia, supaya terasa dekat dengan audiens.

### Karakter (`driver.glb`, `mechanic.glb`)

- **Format:** GLB yang sudah di-rig dengan skeleton humanoid (kompatibel Mixamo).
- **Animasi yang dibutuhkan:**
  - Pengendara: idle, jalan, melihat jam tangan, membuka pintu lalu duduk.
  - Mekanik: idle, melambai, jempol.
- **Alternatif:** satu model karakter, lalu animasinya diambil dari Mixamo (gratis dengan akun Adobe, boleh dipakai komersial dalam proyek). Seragam mekanik bisa diwarnai merah Doktermobil.
- **Ukuran:** maksimal 60 ribu segitiga per karakter.

Begitu file-nya ada, model buatan kode di previz (`makeCar`, `makePerson`) akan diganti dengan model tersebut, lalu animasinya disesuaikan dengan koreografi yang sudah ada.
