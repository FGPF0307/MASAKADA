// Semua teks UI Bahasa Indonesia ada di sini.
export const t = {
  app: { nama: 'MasakAda', slogan: 'Masak dari yang ada.' },
  nav: {
    beranda: 'Beranda',
    pantry: 'Pantry',
    favorit: 'Favorit',
    profil: 'Profil',
    tambah: 'Tambah',
  },
  plus: {
    judul: 'Tambah',
    tambahBahan: 'Tambah bahan',
    bagikanResep: 'Bagikan resep',
    tutup: 'Tutup',
  },
  halaman: {
    beranda: 'Beranda',
    pantry: 'Pantry',
    favorit: 'Favorit & koleksi',
    profil: 'Profil',
    tambahBahan: 'Tambah bahan',
    bagikan: 'Bagikan resepmu',
    belumAda: 'Halaman ini dibuat di langkah berikutnya.',
    memuat: 'Memuat…',
  },
  onboarding: {
    lewati: 'Lewati',
    lanjut: 'Lanjut',
    mulai: 'Mulai',
    sudahPunyaAkun: 'Saya sudah punya akun',
    slide: [
      { judul: 'Mulai dari apa yang kamu punya', isi: 'Masukkan bahan di dapurmu, MasakAda menampilkan resep yang bisa kamu masak sekarang.' },
      { judul: 'Tanpa belanja tambahan', isi: 'Hanya resep yang cocok dengan bahan dan alat dapurmu. Nol limbah, nol biaya tambahan.' },
      { judul: 'Kurang satu bahan? Tanya Chef AI.', isi: 'Anggota Plus bisa minta Chef AI mencarikan pengganti dari pantry. Semua orang bisa membeli bahan yang kurang di toko mitra.' },
    ],
  },
  akun: {
    email: 'Email',
    kataSandi: 'Kata sandi',
    nama: 'Nama',
    atau: 'atau',
    google: 'Lanjutkan dengan Google',
    googleDaftar: 'Daftar dengan Google',
    masuk: {
      judul: 'Selamat datang kembali',
      lupa: 'Lupa kata sandi?',
      tombol: 'Masuk',
      baru: 'Baru di MasakAda?',
      buat: 'Buat akun',
    },
    daftar: {
      judul: 'Buat akunmu',
      isi: 'Akun menyimpan pantry, favorit, dan resepmu di semua perangkat.',
      minimal: 'Minimal 8 karakter',
      setuju: 'Saya setuju dengan Syarat dan Kebijakan Privasi',
      tombol: 'Buat akun',
      sudah: 'Sudah punya akun?',
      masuk: 'Masuk',
      cekEmail: 'Akun dibuat. Cek emailmu untuk konfirmasi, lalu masuk.',
    },
    lupa: {
      judul: 'Lupa kata sandi?',
      isi: 'Masukkan email yang kamu daftarkan. Kami akan mengirim tautan untuk membuat kata sandi baru.',
      tombol: 'Kirim tautan',
      terkirim: 'Tautan sudah dikirim. Cek emailmu.',
      kembali: 'Kembali ke halaman masuk',
    },
    atur: {
      judul: 'Buat kata sandi baru',
      tombol: 'Simpan kata sandi',
      berhasil: 'Kata sandi diperbarui.',
      tanpaSesi: 'Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru.',
    },
    keluar: 'Keluar',
    paket: { gratis: 'Paket Gratis', plus: 'MasakAda Plus' },
  },
  galat: {
    umum: 'Terjadi kesalahan. Coba lagi sebentar.',
    kredensial: 'Email atau kata sandi salah.',
    terdaftar: 'Email ini sudah terdaftar. Coba masuk.',
    belumKonfirmasi: 'Email belum dikonfirmasi. Cek emailmu.',
    sandiPendek: 'Kata sandi minimal 8 karakter.',
    batas: 'Terlalu banyak percobaan. Tunggu beberapa menit.',
  },
}

// Terjemahkan galat Supabase Auth ke Bahasa Indonesia.
export function galatAuth(err) {
  const m = (err?.message ?? '').toLowerCase()
  if (m.includes('invalid login')) return t.galat.kredensial
  if (m.includes('already registered')) return t.galat.terdaftar
  if (m.includes('not confirmed')) return t.galat.belumKonfirmasi
  if (m.includes('at least') || m.includes('weak')) return t.galat.sandiPendek
  if (m.includes('rate limit') || err?.status === 429) return t.galat.batas
  return t.galat.umum
}
