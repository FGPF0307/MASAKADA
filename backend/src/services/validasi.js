import { muatDraf } from './draf.js'

// Kata takaran tidak pasti yang ditolak (spesifikasi aturan 6).
const TIDAK_PASTI = /\b(secukupnya|secukup|sejumput|sesuai selera|seperlunya|sedikit saja)\b/i

// Daftar pemeriksaan sebelum resep dikirim. bagian: halaman wizard tempat memperbaiki.
export async function validasi(db, id) {
  const d = await muatDraf(db, id)
  const checks = []
  const cek = (kode, ok, pesan, bagian, langkah = null) => checks.push({ kode, ok, pesan, bagian, langkah })

  cek('judul', d.judul.trim().length > 0, 'Judul resep terisi', 'info')
  cek('bahan_utama', d.bahan.some((b) => b.peran === 'utama'), 'Minimal 1 bahan Utama', 'bahan')

  const tidakPasti = d.langkah.map((l, i) => [i + 1, l.instruksi.match(TIDAK_PASTI)?.[0]]).filter(([, kata]) => kata)
  if (tidakPasti.length) for (const [n, kata] of tidakPasti) cek('takaran_pasti', false, `Langkah ${n} memakai "${kata}"`, 'langkah', n)
  else cek('takaran_pasti', true, 'Semua takaran pasti (angka + satuan)', 'langkah')

  cek('waktu', d.menit_persiapan > 0 && d.menit_memasak > 0, 'Waktu persiapan & memasak terisi', 'info')
  cek('foto_hasil', !!d.foto_url, 'Foto hasil akhir', 'info')

  const tanpaFoto = d.langkah.filter((l) => !l.foto_url).map((l) => l.urutan)
  if (tanpaFoto.length) for (const n of tanpaFoto) cek('foto_langkah', false, `Langkah ${n} butuh foto`, 'langkah', n)
  else if (d.langkah.length) cek('foto_langkah', true, 'Setiap langkah punya foto', 'langkah')

  const kosong = d.langkah.filter((l) => !l.instruksi.trim()).map((l) => l.urutan)
  for (const n of kosong) cek('instruksi', false, `Langkah ${n} belum ada instruksi`, 'langkah', n)

  cek('min_langkah', d.langkah.length >= 2, 'Minimal 2 langkah', 'langkah')
  return { ok: checks.every((c) => c.ok), perlu_diperbaiki: checks.filter((c) => !c.ok).length, checks }
}
