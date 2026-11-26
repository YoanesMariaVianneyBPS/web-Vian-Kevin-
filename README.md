# Yoanes Vianney — situs esai

Situs statis (HTML, CSS, JS biasa, tanpa build). Bahasa utama Indonesia, kedua English.

## Struktur
- `index.html` — kerangka halaman
- `css/style.css` — semua gaya; warna, font, dan spasi ada di `:root`
- `js/app.js` — teks antarmuka ID/EN, render esai, routing `#essay-<slug>`, animasi
- `content/essays.json` — daftar esai (diedit lewat Pages CMS)
- `content/site.json` — nama, bio, Instagram (diedit lewat Pages CMS)
- `img/` — foto, sampul, dan `decks/<slug>/p-NN.webp` (halaman PDF per esai)
- `fonts/` — font self-hosted (woff2)
- `.pages.yml` — konfigurasi Pages CMS

## Menjalankan lokal
Harus lewat server, bukan klik dua kali (karena memuat JSON):
`python3 -m http.server 8000` lalu buka http://localhost:8000

## Menambah esai dari PDF
Ubah PDF jadi gambar per halaman, simpan di `img/decks/<slug>/`, lalu isi kolom
"Halaman PDF" di Pages CMS. Contoh:
`pdftoppm -r 64 -png esai.pdf p` lalu ubah ke `.webp` lebar 1280px.
