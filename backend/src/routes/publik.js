import { Router } from 'express'
import { galat } from '../middleware/error.js'
import { chipWaktu } from '../services/matching.js'

// Rute tanpa login untuk tamu: etalase resep + pratinjau resep (tampil di balik popup ajakan masuk).
// Pantry, alat, rekomendasi, memasak, ulasan, dan favorit tetap wajib login.
export function buatPublik(db, buatAkun = buatAkunSupabase) {
  const r = Router()

  r.get('/resep', async (req, res) => {
    const { kategori } = req.query
    const { rows } = await db.query(
      `SELECT r.id, r.judul, r.foto_url, r.kategori, r.menit_persiapan, r.menit_memasak, r.kesulitan, r.eksklusif,
              COALESCE(rt.rata, 0)::float AS rata, COALESCE(rt.n, 0)::int AS n
       FROM recipes r
       LEFT JOIN (SELECT recipe_id, avg(bintang) AS rata, count(*) AS n FROM ratings GROUP BY recipe_id) rt ON rt.recipe_id = r.id
       WHERE r.status = 'terbit' AND ($1::text IS NULL OR r.kategori = $1)
       ORDER BY COALESCE(rt.n, 0) DESC, r.terbit_pada DESC`,
      [typeof kategori === 'string' && kategori ? kategori : null],
    )
    res.json(rows.map((x) => {
      const total = x.menit_persiapan + x.menit_memasak
      return {
        id: x.id, judul: x.judul, foto_url: x.foto_url, kategori: x.kategori, kesulitan: x.kesulitan, eksklusif: x.eksklusif,
        total, chip_waktu: chipWaktu(total), rating_rata: Math.round(x.rata * 10) / 10, jumlah_ulasan: x.n,
      }
    }))
  })

  // Pratinjau satu resep untuk tamu (tanpa kecocokan pantry, ulasan, atau aksi apa pun).
  r.get('/resep/:id', async (req, res) => {
    if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) return res.status(404).json({ pesan: 'Resep tidak ditemukan.' })
    const { rows: [x] } = await db.query(
      `SELECT r.id, r.judul, r.deskripsi, r.foto_url, r.kategori, r.menit_persiapan, r.menit_memasak, r.kesulitan, r.eksklusif,
              p.nama AS penulis, COALESCE(rt.rata, 0)::float AS rata, COALESCE(rt.n, 0)::int AS n,
              (SELECT count(*)::int FROM recipe_ingredients WHERE recipe_id = r.id) AS jumlah_bahan,
              (SELECT count(*)::int FROM recipe_steps WHERE recipe_id = r.id) AS jumlah_langkah
       FROM recipes r JOIN profiles p ON p.id = r.penulis_id
       LEFT JOIN (SELECT recipe_id, avg(bintang) AS rata, count(*) AS n FROM ratings GROUP BY recipe_id) rt ON rt.recipe_id = r.id
       WHERE r.id = $1 AND r.status = 'terbit'`,
      [req.params.id],
    )
    if (!x) return res.status(404).json({ pesan: 'Resep tidak ditemukan.' })
    const [bahan, langkah] = await Promise.all([
      db.query(
        `SELECT i.nama, ri.jumlah::float AS jumlah, i.satuan, ri.peran FROM recipe_ingredients ri JOIN ingredients i ON i.id = ri.ingredient_id
         WHERE ri.recipe_id = $1 ORDER BY ri.peran, i.nama`, [x.id],
      ),
      db.query('SELECT urutan, fase, instruksi FROM recipe_steps WHERE recipe_id = $1 ORDER BY urutan', [x.id]),
    ])
    const total = x.menit_persiapan + x.menit_memasak
    res.json({
      bahan: bahan.rows, langkah: langkah.rows,
      id: x.id, judul: x.judul, deskripsi: x.deskripsi, foto_url: x.foto_url, kategori: x.kategori, kesulitan: x.kesulitan,
      eksklusif: x.eksklusif, penulis: x.penulis, total, chip_waktu: chipWaktu(total),
      rating_rata: Math.round(x.rata * 10) / 10, jumlah_ulasan: x.n, jumlah_bahan: x.jumlah_bahan, jumlah_langkah: x.jumlah_langkah,
    })
  })

  // Daftar tanpa konfirmasi email: akun dibuat lewat Admin API Supabase dengan email langsung terverifikasi.
  // Frontend lalu masuk dengan email & sandi yang sama.
  r.post('/daftar', async (req, res) => {
    const { nama, email, sandi } = req.body ?? {}
    const namaBersih = typeof nama === 'string' ? nama.trim() : ''
    if (!namaBersih || namaBersih.length > 100) throw galat(400, 'Nama harus 1–100 karakter.')
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw galat(400, 'Email tidak valid.')
    if (typeof sandi !== 'string' || sandi.length < 8 || sandi.length > 72) throw galat(400, 'Kata sandi minimal 8 karakter.')
    await buatAkun({ nama: namaBersih, email: email.trim().toLowerCase(), sandi })
    res.status(201).json({ ok: true })
  })

  return r
}

async function buatAkunSupabase({ nama, email, sandi }) {
  const base = process.env.SUPABASE_URL
  const kunci = process.env.SUPABASE_SERVICE_KEY
  if (!base || !kunci) throw galat(503, 'Pendaftaran belum dikonfigurasi.')
  const res = await fetch(`${base}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { apikey: kunci, Authorization: `Bearer ${kunci}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: sandi, email_confirm: true, user_metadata: { nama } }),
  })
  if (res.ok) return
  const isi = await res.json().catch(() => ({}))
  const pesan = `${isi.msg ?? isi.message ?? isi.error_code ?? ''}`.toLowerCase()
  if (res.status === 422 && /already|exists|registered/.test(pesan)) throw galat(409, 'Email ini sudah terdaftar. Silakan masuk.')
  if (/password/.test(pesan)) throw galat(400, 'Kata sandi terlalu lemah. Gunakan minimal 8 karakter.')
  console.error('Daftar gagal', res.status, isi)
  throw galat(502, 'Gagal membuat akun. Coba lagi sebentar.')
}
