import { Router } from 'express'
import { galat } from '../middleware/error.js'
import { levelDari } from '../services/level.js'
import { bahanDulu, chipWaktu, hitungResep, statusBahan, urutkan } from '../services/matching.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const WAKTU = ['kilat', 'cepat', 'sedang', 'lama']
const KESULITAN = ['mudah', 'sedang', 'sulit']
const URUT = ['bahan', 'tercepat', 'rating']

// "a,b" → ['a','b']; menolak nilai di luar daftar.
function daftar(nilai, boleh, nama) {
  if (!nilai) return []
  const a = String(nilai).split(',')
  if (a.some((x) => !boleh.includes(x))) throw galat(400, `Nilai "${nama}" tidak valid.`)
  return a
}

export function buatResep(db) {
  const r = Router()

  const porsiDari = async (req) => {
    if (req.query.porsi !== undefined) {
      const p = Number(req.query.porsi)
      if (!Number.isInteger(p) || p < 1 || p > 20) throw galat(400, 'Porsi harus 1–20.')
      return p
    }
    const { rows } = await db.query('SELECT porsi_default FROM profiles WHERE id=$1', [req.user.id])
    return rows[0]?.porsi_default ?? 1
  }
  // Label status untuk daftar cari/jelajahi: 'siap' atau jumlah bahan yang kurang.
  const beriLabel = (x) => ({ ...x, label: x.jumlah_kurang === 0 ? 'siap' : x.jumlah_kurang })
  const terbaikDulu = (a, b) => a.jumlah_kurang - b.jumlah_kurang || bahanDulu(a, b)

  // Beranda/Hasil: hanya resep yang siap dimasak, dan yang kurang tepat 1 bahan utama.
  r.get('/cocok', async (req, res) => {
    const q = req.query
    const waktu = daftar(q.waktu, WAKTU, 'waktu')
    const kesulitan = daftar(q.kesulitan, KESULITAN, 'kesulitan')
    const urut = q.urut ?? 'bahan'
    if (!URUT.includes(urut)) throw galat(400, 'Nilai "urut" tidak valid.')
    const porsi = await porsiDari(req)

    const { resep, jumlah_pantry } = await hitungResep(db, req.user.id, porsi)
    const lolos = resep.filter(
      (x) =>
        (q.alatLain === 'true' || !x.butuh_alat_lain) &&
        (!waktu.length || waktu.includes(x.chip_waktu)) &&
        (!kesulitan.length || kesulitan.includes(x.kesulitan)) &&
        (!q.alat || x.alat.includes(q.alat)),
    )
    res.json({
      siap: urutkan(lolos.filter((x) => x.jumlah_kurang === 0), urut),
      kurang1: urutkan(lolos.filter((x) => x.jumlah_kurang === 1), urut),
      jumlah_pantry,
      porsi,
    })
  })

  // Cari berdasarkan nama resep atau bahan (nama + sinonim).
  r.get('/cari', async (req, res) => {
    const q = String(req.query.q ?? '').trim().toLowerCase()
    const mode = req.query.mode ?? 'nama'
    if (!q) return res.json([])
    if (!['nama', 'bahan'].includes(mode)) throw galat(400, 'Mode pencarian tidak valid.')
    const { resep } = await hitungResep(db, req.user.id, await porsiDari(req))
    let cocok
    if (mode === 'nama') cocok = resep.filter((x) => x.judul.toLowerCase().includes(q))
    else {
      const { rows } = await db.query(
        `SELECT DISTINCT ri.recipe_id FROM recipe_ingredients ri JOIN ingredients i ON i.id = ri.ingredient_id
         WHERE lower(i.nama) LIKE '%'||$1||'%' OR EXISTS (SELECT 1 FROM unnest(i.sinonim) s WHERE lower(s) LIKE '%'||$1||'%')`,
        [q],
      )
      const ids = new Set(rows.map((x) => x.recipe_id))
      cocok = resep.filter((x) => ids.has(x.id))
    }
    res.json(cocok.sort(terbaikDulu).map(beriLabel))
  })

  // Semua resep tanpa melihat pantry (label tetap menunjukkan Siap / Kurang N).
  r.get('/jelajahi', async (req, res) => {
    const { resep } = await hitungResep(db, req.user.id, await porsiDari(req))
    const { kategori } = req.query
    res.json(resep.filter((x) => !kategori || x.kategori === kategori).sort(terbaikDulu).map(beriLabel))
  })

  // Detail resep + status tiap bahan untuk pengguna ini (tabel 5.3), takaran diskalakan ke ?porsi=.
  r.get('/:id', async (req, res, next) => {
    const { id } = req.params
    if (!UUID.test(id)) return next()
    const porsi = await porsiDari(req)
    const { rows: [rc] } = await db.query(
      `SELECT r.*, pr.nama AS penulis, pr.poin AS penulis_poin FROM recipes r JOIN profiles pr ON pr.id = r.penulis_id
       WHERE r.id = $1 AND r.status = 'terbit'`,
      [id],
    )
    if (!rc) throw galat(404, 'Resep tidak ditemukan.')

    const [bahan, alat, langkah, rating, dicoba] = await Promise.all([
      statusBahan(db, req.user.id, porsi, id),
      db.query(
        `SELECT t.nama, rt.catatan, COALESCE(u.punya, t.diasumsikan_ada) AS punya
         FROM recipe_tools rt JOIN tools t ON t.id = rt.tool_id LEFT JOIN user_tools u ON u.tool_id = t.id AND u.user_id = $2
         WHERE rt.recipe_id = $1 ORDER BY t.id`,
        [id, req.user.id],
      ),
      db.query('SELECT urutan, fase, foto_url, instruksi, timer_menit FROM recipe_steps WHERE recipe_id = $1 ORDER BY urutan', [id]),
      db.query('SELECT COALESCE(avg(bintang), 0)::float AS rata, count(*)::int AS n FROM ratings WHERE recipe_id = $1', [id]),
      db.query('SELECT count(DISTINCT user_id)::int AS n FROM cook_history WHERE recipe_id = $1', [id]),
    ])

    const inti = bahan.filter((b) => b.peran !== 'opsional' && b.status !== 'pokok')
    const total = rc.menit_persiapan + rc.menit_memasak
    res.json({
      id: rc.id, judul: rc.judul, deskripsi: rc.deskripsi, foto_url: rc.foto_url, kategori: rc.kategori,
      penulis: rc.penulis, penulis_level: levelDari(rc.penulis_poin).nama,
      rating_rata: Math.round(rating.rows[0].rata * 10) / 10, jumlah_ulasan: rating.rows[0].n, dicoba_orang: dicoba.rows[0].n,
      menit_persiapan: rc.menit_persiapan, menit_memasak: rc.menit_memasak, total, chip_waktu: chipWaktu(total),
      kesulitan: rc.kesulitan, perlu_h_minus_1: rc.perlu_h_minus_1, eksklusif: rc.eksklusif,
      porsi_resep: rc.porsi, porsi_dipilih: porsi,
      alat: alat.rows,
      bahan: bahan.map(({ recipe_id, ...b }) => b), // eslint-disable-line no-unused-vars
      ringkasan: {
        bahan_kurang: inti.filter((b) => b.status === 'tidak_ada').map((b) => ({ id: b.ingredient_id, nama: b.nama, satuan: b.satuan, butuh: b.butuh })),
        ada_kurang_takaran: inti.some((b) => b.status === 'kurang_jumlah'),
      },
      langkah: langkah.rows,
    })
  })

  return r
}
