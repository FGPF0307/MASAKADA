import { Router } from 'express'
import { galat } from '../middleware/error.js'
import { levelDari } from '../services/level.js'
import { sisaKuota } from '../services/kuota.js'
import { hitungResep } from '../services/matching.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAKS_KOLEKSI = 20
const HEMAT_PER_BAHAN = 3500 // perkiraan kasar (Rp) per bahan pantry yang terpakai; hanya untuk laporan Plus

// Favorit, koleksi, riwayat memasak, ringkasan profil (spesifikasi 8.11).
export function buatPribadi(db) {
  const r = Router()

  const terbit = async (id) => {
    if (!UUID.test(String(id)) || !(await db.query("SELECT 1 FROM recipes WHERE id=$1 AND status='terbit'", [id])).rows.length) throw galat(404, 'Resep tidak ditemukan.')
  }
  const milik = async (id, userId) => {
    if (!UUID.test(String(id)) || !(await db.query('SELECT 1 FROM collections WHERE id=$1 AND user_id=$2', [id, userId])).rows.length) throw galat(404, 'Koleksi tidak ditemukan.')
  }
  const porsiDefault = async (userId) => (await db.query('SELECT porsi_default FROM profiles WHERE id=$1', [userId])).rows[0]?.porsi_default ?? 1

  r.get('/favorit', async (req, res) => {
    const { koleksi } = req.query
    if (koleksi) await milik(koleksi, req.user.id)
    const [{ resep }, fav, kol] = await Promise.all([
      porsiDefault(req.user.id).then((p) => hitungResep(db, req.user.id, p)),
      db.query(
        `SELECT f.recipe_id FROM favorites f WHERE f.user_id=$1
         AND ($2::uuid IS NULL OR EXISTS (SELECT 1 FROM collection_items ci WHERE ci.collection_id=$2 AND ci.recipe_id=f.recipe_id))
         ORDER BY f.disimpan_pada DESC`,
        [req.user.id, koleksi ?? null],
      ),
      db.query(
        `SELECT c.id, c.nama, count(ci.recipe_id)::int AS jumlah FROM collections c LEFT JOIN collection_items ci ON ci.collection_id=c.id
         WHERE c.user_id=$1 GROUP BY c.id ORDER BY c.nama`,
        [req.user.id],
      ),
    ])
    const per = new Map(resep.map((x) => [x.id, x]))
    const daftar = fav.rows.flatMap((f) => {
      const x = per.get(f.recipe_id)
      return x ? [{ ...x, label: x.jumlah_kurang === 0 ? 'siap' : x.jumlah_kurang }] : []
    })
    const total = (await db.query('SELECT count(*)::int AS n FROM favorites WHERE user_id=$1', [req.user.id])).rows[0].n
    res.json({ total, koleksi: kol.rows, resep: daftar })
  })

  r.post('/favorit', async (req, res) => {
    const id = req.body?.recipe_id
    await terbit(id)
    await db.query('INSERT INTO favorites (user_id, recipe_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.user.id, id])
    res.status(201).json({ ok: true })
  })

  // Menghapus favorit juga mengeluarkannya dari semua koleksi pengguna.
  r.delete('/favorit/:recipe_id', async (req, res) => {
    const { recipe_id: id } = req.params
    if (!UUID.test(id)) throw galat(404, 'Resep tidak ditemukan.')
    await db.query('DELETE FROM collection_items WHERE recipe_id=$1 AND collection_id IN (SELECT id FROM collections WHERE user_id=$2)', [id, req.user.id])
    await db.query('DELETE FROM favorites WHERE user_id=$1 AND recipe_id=$2', [req.user.id, id])
    res.status(204).end()
  })

  // ?recipe_id= menandai koleksi mana yang sudah memuat resep itu.
  r.get('/koleksi', async (req, res) => {
    const rid = UUID.test(String(req.query.recipe_id)) ? req.query.recipe_id : null
    const { rows } = await db.query(
      `SELECT c.id, c.nama, count(ci.recipe_id)::int AS jumlah, bool_or(ci.recipe_id = $2::uuid) AS ada
       FROM collections c LEFT JOIN collection_items ci ON ci.collection_id=c.id WHERE c.user_id=$1 GROUP BY c.id ORDER BY c.nama`,
      [req.user.id, rid],
    )
    res.json(rows.map((k) => ({ ...k, ada: !!k.ada })))
  })

  r.post('/koleksi', async (req, res) => {
    const nama = typeof req.body?.nama === 'string' ? req.body.nama.trim() : ''
    if (!nama || nama.length > 60) throw galat(400, 'Nama koleksi harus 1–60 karakter.')
    const { rows } = await db.query('SELECT lower(nama) AS n FROM collections WHERE user_id=$1', [req.user.id])
    if (rows.length >= MAKS_KOLEKSI) throw galat(400, `Maksimal ${MAKS_KOLEKSI} koleksi.`)
    if (rows.some((k) => k.n === nama.toLowerCase())) throw galat(409, 'Nama koleksi itu sudah ada.')
    const { rows: [k] } = await db.query('INSERT INTO collections (user_id, nama) VALUES ($1,$2) RETURNING id, nama', [req.user.id, nama])
    res.status(201).json({ ...k, jumlah: 0 })
  })

  r.delete('/koleksi/:id', async (req, res) => {
    await milik(req.params.id, req.user.id)
    await db.query('DELETE FROM collections WHERE id=$1', [req.params.id]) // isi koleksi ikut terhapus; favorit tetap
    res.status(204).end()
  })

  r.post('/koleksi/:id/resep', async (req, res) => {
    await milik(req.params.id, req.user.id)
    const rid = req.body?.recipe_id
    await terbit(rid)
    await db.query('INSERT INTO favorites (user_id, recipe_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.user.id, rid])
    await db.query('INSERT INTO collection_items (collection_id, recipe_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.params.id, rid])
    res.status(201).json({ ok: true })
  })

  r.delete('/koleksi/:id/resep/:recipe_id', async (req, res) => {
    await milik(req.params.id, req.user.id)
    if (!UUID.test(req.params.recipe_id)) throw galat(404, 'Resep tidak ditemukan.')
    await db.query('DELETE FROM collection_items WHERE collection_id=$1 AND recipe_id=$2', [req.params.id, req.params.recipe_id])
    res.status(204).end()
  })

  r.get('/riwayat', async (req, res) => {
    const [daftar, bulan] = await Promise.all([
      db.query(
        `SELECT h.id, h.recipe_id, h.dimasak_pada, h.pakai_pengganti, h.bahan_terpakai, r.judul, r.foto_url, (r.status='terbit') AS bisa_lagi, rt.bintang
         FROM cook_history h JOIN recipes r ON r.id=h.recipe_id LEFT JOIN ratings rt ON rt.recipe_id=h.recipe_id AND rt.user_id=h.user_id
         WHERE h.user_id=$1 ORDER BY h.dimasak_pada DESC LIMIT 100`,
        [req.user.id],
      ),
      db.query(
        "SELECT count(*)::int AS masakan, COALESCE(sum(bahan_terpakai),0)::int AS bahan FROM cook_history WHERE user_id=$1 AND dimasak_pada >= date_trunc('month', now())",
        [req.user.id],
      ),
    ])
    res.json({ bulan_ini: bulan.rows[0].masakan, bahan_bulan_ini: bulan.rows[0].bahan, daftar: daftar.rows })
  })

  r.get('/ringkasan-profil', async (req, res) => {
    const [{ rows: [p] }, { rows: [s] }, chef] = await Promise.all([
      db.query('SELECT nama, paket, poin, dibuat_pada FROM profiles WHERE id=$1', [req.user.id]),
      db.query(
        `SELECT (SELECT count(*) FROM cook_history WHERE user_id=$1)::int AS masakan,
                (SELECT count(*) FROM recipes WHERE penulis_id=$1 AND status='terbit')::int AS dibagikan,
                (SELECT COALESCE(sum(bahan_terpakai),0) FROM cook_history WHERE user_id=$1 AND dimasak_pada >= date_trunc('month', now()))::int AS bahan_bulan_ini`,
        [req.user.id],
      ),
      sisaKuota(db, req.user.id, 'chat'),
    ])
    if (!p) throw galat(404, 'Profil tidak ditemukan.')
    res.json({
      nama: p.nama, paket: p.paket, poin: p.poin, level: levelDari(p.poin).nama, bergabung: p.dibuat_pada,
      masakan: s.masakan, dibagikan: s.dibagikan, bahan_bulan_ini: s.bahan_bulan_ini,
      uang_dihemat_perkiraan: p.paket === 'plus' ? s.bahan_bulan_ini * HEMAT_PER_BAHAN : null,
      chef: { sisa: chef.sisa, batas: chef.batas },
    })
  })

  return r
}
