## Tentang MasakAda

Aplikasi resep biasa bertanya *"mau masak apa?"*, lalu meminta kamu membeli bahan yang belum ada. Akibatnya, bahan yang sudah dibeli sering terlupakan di kulkas sampai terbuang.

MasakAda membalik pertanyaannya: **"Ada bahan apa di dapurmu?"** Kamu mengisi bahan yang kamu punya, lalu aplikasi hanya menampilkan resep yang **bisa dimasak sekarang**, tanpa belanja tambahan.

Aplikasi resep biasa dimulai dengan pertanyaan *"mau masak apa?"*. Kamu memilih resep, lalu membeli bahan yang belum ada. Cara ini memicu belanja baru, mengasumsikan dapur yang lengkap, dan membuatmu buntu ketika satu bahan saja kurang.

MasakAda dimulai dari pertanyaan sebaliknya: *"ada bahan apa di dapurmu?"*. Kamu mengisi bahan yang kamu punya, lalu aplikasi menampilkan resep yang cocok. Dengan begitu stok yang ada terpakai habis, dan resepnya menyesuaikan alat seadanya, misalnya hanya rice cooker. Kalau ada satu bahan yang kurang, MasakAda memberi tautan ke toko mitra atau saran pengganti dari Chef AI.




## Misi dan Untuk Siapa

**Misi:** nol limbah makanan dan nol biaya tambahan.

**Untuk siapa:**
- Mahasiswa dan anak kos dengan anggaran ketat dan alat seadanya
- Pekerja muda yang ingin masak cepat sepulang kerja
- Pemula yang butuh takaran pasti dan langkah berfoto
- Kontributor yang ingin berbagi resep dan mendapat pengakuan




## Fitur

### Gratis

- **Pantry**: tempat mencatat bahan yang ada di dapur, lengkap dengan jumlahnya. Waktu mengetik nama bahan, akan muncul saran supaya namanya sama dengan yang dipakai di resep.
- **Resep siap dimasak**: yang muncul cuma resep yang bahan utamanya sudah kamu punya. Resep yang paling banyak pakai bahanmu ada di urutan atas.
- **Kurang 1 bahan**: resep yang kurang satu bahan ditaruh di bagian sendiri. Bahan yang kurang bisa langsung dicari di toko mitra seperti Astro atau Sayurbox.
- **Cek jumlah bahan**: misalnya resep butuh 300 g ayam tapi kamu cuma punya 200 g. Resepnya tetap muncul, hanya ada catatan kalau porsinya bisa jadi lebih sedikit.
- **Bahan pokok**: air, garam, dan minyak goreng dianggap selalu ada. Bumbu lain seperti bawang putih atau kecap bisa kamu centang sendiri.
- **Alat dan preferensi**: punya rice cooker saja? Resep yang tampil akan menyesuaikan dengan alat yang kamu punya.
- **Filter dan pencarian**: cari resep dari nama atau bahannya, lalu saring berdasarkan lama memasak, porsi, atau tingkat kesulitan.
- **Mode memasak**: langkah ditampilkan satu per satu, ada foto dan timernya, dan layar tidak mati selama kamu memasak.
- **Stok berkurang otomatis**: setelah selesai masak, bahan yang terpakai langsung dikurangi dari pantry. Kalau pemakaiannya beda dari resep, jumlahnya bisa diubah.
- **Ulasan dan komentar**: siapa pun bisa berkomentar, tapi yang bisa memberi bintang hanya orang yang sudah mencoba memasaknya.
- **Bagikan resep**: kamu bisa mengunggah resep sendiri. Sebelum tampil ke pengguna lain, resepnya dicek dulu oleh moderator.
- **Poin kontributor**: setiap resep yang terbit, dimasak orang lain, atau dapat rating bagus akan menambah poin. Poin ini dipakai untuk naik level dan membuka lencana.
- **Favorit dan koleksi**: simpan resep yang kamu suka dan kelompokkan sesukamu, misalnya "Menu akhir bulan".
- **Riwayat memasak**: semua yang pernah kamu masak tercatat, jadi gampang kalau mau masak lagi.
- **Chat Chef AI**: bisa tanya apa saja soal masak atau isi pantry, jatahnya 3 pertanyaan seminggu.

### MasakAda Plus

Untuk demo, pembayarannya hanya simulasi.

- **Scan bahan**: cukup foto isi kulkas, nanti Chef AI mengenali bahannya. Kamu tinggal cek lalu simpan ke pantry.
- **Pengganti bahan**: kalau ada bahan yang kurang, Chef AI bisa menyarankan penggantinya beserta takarannya.
- **Chat Chef AI tanpa batas mingguan yang ketat**: jatah pertanyaannya jauh lebih banyak.
- **Rencana menu mingguan**: menu untuk 7 hari disusun dari bahan yang ada di pantrymu.
- **Kalori dan nutrisi**: setiap resep dilengkapi info gizinya.
- **Resep eksklusif**: resep khusus dari kontributor terbaik dan workshop.
- **Workshop Zoom**: gratis satu kali tiap bulan, workshop berikutnya diskon 50%.
- **Bebas iklan**.






## Teknologi yang digunakan

### Frontend
- **React (Vite)**: untuk membuat tampilan web.
- **Tailwind CSS**: untuk styling, supaya tampilannya pas di HP, tablet, maupun laptop.

### Backend
- **Node.js + Express**: mengatur logika aplikasi, seperti mencocokkan resep, mengurangi stok, dan menghitung poin.
- **PostgreSQL (Supabase)**: database untuk data pengguna, pantry, resep, dan ulasan.
- **Supabase Auth**: untuk login pakai email atau akun Google.
- **Supabase Storage**: tempat menyimpan foto resep dan ulasan.

### Lainnya
- **Google Gemini**: AI di balik Chef AI, dipakai untuk chat, scan bahan, dan saran pengganti.
- **Vercel**: hosting untuk frontend.
- **Figma**: untuk mendesain prototipe.




## Tim

Kelompok 2 · BINUS University · Computer Science

| Nama | GitHub | Peran |
|---|---|---|
| Farrel Ganendra P. F. | [@FGPF0307](https://github.com/FGPF0307) | _isi peran_ |
| _Nama anggota_ | [@username](https://github.com/username) | _isi peran_ |
| _Nama anggota_ | [@username](https://github.com/username) | _isi peran_ |
