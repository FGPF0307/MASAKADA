// Teks untuk 8 Golden Rules Shneiderman: umpan balik, konfirmasi, dan halaman Prinsip desain.
export const u = {
  batal: 'Batal',
  urungkan: 'Urungkan',
  ya: 'Ya',
  bahanDisimpan: 'Bahan disimpan ke pantry',
  bahanDihapus: 'Bahan dihapus dari pantry',
  bahanKembali: 'Bahan dikembalikan ke pantry',
  hapusBahan: { judul: 'Hapus bahan ini?', isi: 'Bahan akan dihapus dari pantrymu. Kamu masih bisa mengurungkannya sebentar setelahnya.', ya: 'Hapus' },
  favoritTambah: 'Disimpan ke favorit',
  favoritHapus: 'Dihapus dari favorit',
  koleksiHapus: { judul: 'Hapus koleksi ini?', isi: 'Resep di dalamnya tetap tersimpan di favoritmu. Hanya koleksinya yang dihapus.', ya: 'Hapus koleksi' },
  keluar: { judul: 'Keluar dari akun?', isi: 'Kamu perlu masuk lagi untuk memakai MasakAda.', ya: 'Keluar' },
  berhenti: { judul: 'Berhenti berlangganan Plus?', isi: 'Fitur Plus berhenti sekarang dan kuota Chef AI kembali ke paket Gratis.', ya: 'Berhenti' },
  keluarMasak: { judul: 'Berhenti memasak?', isi: 'Kamu sedang di tengah resep. Stok pantry belum berubah sampai kamu menekan "Selesai memasak".', ya: 'Berhenti', tetap: 'Lanjut memasak' },
  scanTersimpan: (n) => `${n} bahan ditambahkan ke pantry`,
  plusAktif: 'Plus aktif. Selamat memasak!',
  plusBerhenti: 'Langganan Plus dihentikan',
  koleksiTersimpan: 'Disimpan ke koleksi',
  lewatiKonten: 'Lewati ke konten',
  ukuranTeks: 'Ukuran teks',
  ukuran: [['normal', 'Normal'], ['besar', 'Besar'], ['sangat', 'Sangat besar']],
  pintasan: 'Pintasan: tekan / untuk mencari, tombol ← → untuk pindah langkah saat memasak.',
  lihatPrinsip: 'Prinsip desain aplikasi',
}

export const prinsip = {
  judul: 'Prinsip desain',
  sub: '8 Golden Rules of Interface Design (Ben Shneiderman) dan wujudnya di MasakAda.',
  aturan: [
    {
      nama: 'Berusaha konsisten', en: 'Strive for consistency',
      isi: 'Tampilan, istilah, dan urutan aksi dibuat sama di semua layar supaya pengguna tidak perlu belajar ulang.',
      wujud: ['Satu palet warna dan satu pasang huruf (Poppins Bold untuk judul + Inter untuk teks isi) di semua layar.', 'Komponen yang sama dipakai ulang: kartu resep, lembar bawah, chip, tombol, pesan galat.', 'Tombol kembali selalu di kiri atas; konfirmasi, umpan balik, dan galat tampil dengan gaya yang sama.', 'Istilah tetap: "Siap dimasak", "Kurang 1 bahan", "Pantry", satuan hanya g / ml / butir.'],
    },
    {
      nama: 'Usability universal', en: 'Seek universal usability',
      isi: 'Melayani pemula sampai mahir, dan pengguna dengan kebutuhan yang berbeda.',
      wujud: ['Level keahlian Pemula / Menengah / Mahir menentukan saran kesulitan resep.', 'Pintasan untuk yang sudah mahir: tombol / membuka pencarian, tombol ← → memindah langkah memasak.', 'Ukuran teks Normal / Besar / Sangat besar di Pengaturan.', 'Label untuk pembaca layar, fokus keyboard terlihat, tautan "Lewati ke konten", dan animasi dikurangi bila perangkat memintanya.', 'Berjalan di HP, tablet, dan laptop; cangkang aplikasi tetap terbuka saat offline.'],
    },
    {
      nama: 'Beri umpan balik yang informatif', en: 'Offer informative feedback',
      isi: 'Setiap aksi dijawab sistem dengan cara yang jelas dan sepadan.',
      wujud: ['Notifikasi singkat (toast) setelah menyimpan bahan, favorit, koleksi, scan, dan berlangganan.', 'Skeleton dan teks "Mencocokkan resep dengan pantrymu…" saat memuat.', 'Status bahan berwarna (Ada / Kurang / Opsional) dan catatan "Porsi mungkin lebih kecil".', 'Timer, bilah progres langkah, penghitung dampak, serta notifikasi poin dan lencana.'],
    },
    {
      nama: 'Rancang dialog yang berujung penutupan', en: 'Design dialogs to yield closure',
      isi: 'Rangkaian aksi punya awal, tengah, dan akhir yang jelas.',
      wujud: ['Setup 3 langkah dengan penanda "1 dari 3", lalu masuk Beranda.', 'Layar "Selesai memasak" merangkum stok yang terpakai sebelum penilaian.', 'Layar "Resep terkirim!" menjelaskan langkah berikutnya (ditinjau moderator).', 'Layar "Kamu terdaftar!" dengan kode tiket setelah mendaftar workshop.'],
    },
    {
      nama: 'Cegah kesalahan', en: 'Prevent errors',
      isi: 'Rancang supaya kesalahan sulit terjadi, dan beri jalan keluar bila terjadi.',
      wujud: ['Satuan bahan dikunci dan nama bahan diambil dari daftar baku, jadi pantry selalu cocok dengan resep.', 'Resep hanya menerima takaran pasti (angka + satuan); "secukupnya" ditolak dan ada checklist sebelum kirim.', 'Dialog konfirmasi sebelum hapus bahan, hapus koleksi, keluar akun, berhenti Plus, dan berhenti memasak; tombol aman (Batal) dipilih lebih dulu.', 'Tombol dinonaktifkan saat data belum valid; kuota Chef AI baru terpakai saat "Tanya" ditekan.'],
    },
    {
      nama: 'Izinkan pembatalan aksi dengan mudah', en: 'Permit easy reversal of actions',
      isi: 'Pengguna berani mencoba karena hampir semua aksi bisa dibatalkan.',
      wujud: ['Tombol "Urungkan" setelah menghapus bahan dari pantry atau menghapus favorit.', 'Draf resep tersimpan otomatis dan bisa dilanjutkan.', 'Stok setelah memasak bisa diubah atau dilewati; rating bisa diubah; filter bisa dihapus satu per satu atau "Atur ulang".', 'Hasil scan Chef AI harus dicek dulu, baru masuk pantry.'],
    },
    {
      nama: 'Pengguna merasa memegang kendali', en: 'Keep users in control',
      isi: 'Sistem merespons pengguna, bukan sebaliknya; tidak ada kejutan.',
      wujud: ['Onboarding, penilaian, dan pengurangan stok semuanya boleh dilewati.', 'Preferensi (alat, bahan pokok, porsi, "Kurang 1 bahan", notifikasi) bisa diubah kapan saja.', 'Tidak ada aksi otomatis yang mengubah pantry tanpa persetujuan; pembayaran Plus pun jelas berlabel simulasi.', 'Keluar dari mode memasak kapan saja, dengan konfirmasi agar tidak tak sengaja.'],
    },
    {
      nama: 'Kurangi beban ingatan jangka pendek', en: 'Reduce short-term memory load',
      isi: 'Pengguna mengenali, bukan mengingat: informasi yang dibutuhkan ada di layar.',
      wujud: ['Mode memasak menampilkan satu langkah per layar beserta bahan dan alat yang dipakai di langkah itu.', 'Detail resep merangkum pantry: "Semua bahan utama ada" atau "Kurang: kecap manis".', 'Saran otomatis nama bahan, chip "Baru dipakai", pencarian terakhir, dan porsi bawaan.', 'Progres selalu terlihat: "Langkah 3 dari 4", "1 dari 3", level dan poin.'],
    },
  ],
}
