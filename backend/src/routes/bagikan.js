import { Router } from 'express'
import { transaksi } from '../db/transaksi.js'
import { galat } from '../middleware/error.js'
import { muatDraf } from '../services/draf.js'
import { urlFotoValid } from '../services/storage.js'
import { validasi } from '../services/validasi.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const KATEGORI = ['Rice cooker', 'Mi', 'Sup', 'Nasi', 'Lauk', 'Camilan']
const int = (v, min, max) => Number.isInteger(v) && v >= min && v <= max
const teks = (v, max) => typeof v === 'string' && v.length <= max

// Kolom info resep yang boleh diubah penulis + validasinya.
const INFO = {
  judul: (v) => teks(v, 150),
  deskripsi: (v) => v === null || teks(v, 500),
  foto_url: (v) => v === null || urlFotoValid(v),
  kategori: (v) => v === null || KATEGORI.includes(v),
  porsi: (v) => int(v, 1, 50),
  menit_persiapan: (v) => v === null || int(v, 1, 240),
  menit_memasak: (v) => v === null || int(v, 1, 240),
  kesulitan: (v) => ['mudah', 'sedang', 'sulit'].includes(v),
  perlu_h_minus_1: (v) => typeof v === 'boolean',
}

export function buatBagikan(db) {
  const r = Router()

  // Hanya milik sendiri dan hanya saat masih bisa disunting (draf atau ditolak).
  const milikDraf = async (id, userId) => {
    const { rows: [rc] } = await db.query('SELECT id, status FROM recipes WHERE id=$1 AND penulis_id=$2', [id, userId])
    if (!rc) throw galat(404, 'Resep tidak ditemukan.')
    if (!['draf', 'ditolak'].includes(rc.status)) throw galat(409, 'Resep yang sedang ditinjau atau sudah terbit tidak bisa diubah.')
    return rc
  }

  r.post('/resep', async (req, res) => {
    const { rows: [{ n }] } = await db.query("SELECT count(*)::int AS n FROM recipes WHERE penulis_id=$1 AND status='draf'", [req.user.id])
    if (n >= 10) throw galat(429, 'Kamu sudah punya 10 draf. Selesaikan atau hapus salah satunya dulu.')
    const { rows } = await db.query("INSERT INTO recipes (penulis_id, judul) VALUES ($1, '') RETURNING id", [req.user.id])
    res.status(201).json({ id: rows[0].id })
  })

  // Simpan draf: hanya bagian yang dikirim yang diganti (bahan dan langkah diganti utuh).
  r.patch('/resep/:id', async (req, res, next) => {
    const { id } = req.params
    if (!UUID.test(id)) return next()
    await milikDraf(id, req.user.id)
    const b = req.body ?? {}

    const set = []
    const nilai = [id]
    for (const [k, ok] of Object.entries(INFO)) {
      if (!(k in b)) continue
      if (!ok(b[k])) throw galat(400, `Nilai "${k}" tidak valid.`)
      nilai.push(b[k])
      set.push(`${k}=$${nilai.length}`)
    }

    if ('alat' in b) {
      if (!Array.isArray(b.alat) || b.alat.length > 20 || !b.alat.every((x) => int(x, 1, 1e6))) throw galat(400, 'Daftar alat tidak valid.')
      const { rows } = await db.query('SELECT count(*)::int AS n FROM tools WHERE id = ANY($1::int[])', [b.alat])
      if (rows[0].n !== new Set(b.alat).size) throw galat(400, 'Ada alat yang tidak dikenal.')
    }
    let idBahan
    if ('bahan' in b) {
      const l = b.bahan
      if (!Array.isArray(l) || l.length > 40) throw galat(400, 'Daftar bahan tidak valid.')
      for (const x of l) {
        if (!int(x?.ingredient_id, 1, 1e9) || typeof x.jumlah !== 'number' || !(x.jumlah > 0) || x.jumlah > 100000 || !['utama', 'opsional', 'bumbu_dasar'].includes(x.peran))
          throw galat(400, 'Setiap bahan butuh jumlah angka lebih dari 0 dan peran yang valid.')
      }
      idBahan = l.map((x) => x.ingredient_id)
      if (new Set(idBahan).size !== idBahan.length) throw galat(400, 'Ada bahan yang dimasukkan dua kali.')
      const { rows } = await db.query(
        "SELECT count(*)::int AS n FROM ingredients WHERE id = ANY($1::int[]) AND (status='baku' OR (status='menunggu' AND diajukan_oleh=$2))",
        [idBahan, req.user.id],
      )
      if (rows[0].n !== idBahan.length) throw galat(400, 'Ada bahan yang tidak ditemukan.')
    }
    if ('langkah' in b) {
      const l = b.langkah
      if (!Array.isArray(l) || l.length > 30) throw galat(400, 'Daftar langkah tidak valid.')
      const sah = new Set(idBahan ?? (await db.query('SELECT ingredient_id FROM recipe_ingredients WHERE recipe_id=$1', [id])).rows.map((x) => x.ingredient_id))
      for (const x of l) {
        const ok = ['persiapan', 'memasak'].includes(x?.fase) && teks(x.instruksi, 1000) && (x.foto_url == null || urlFotoValid(x.foto_url)) &&
          (x.timer_menit == null || int(x.timer_menit, 1, 240)) && Array.isArray(x.bahan) && x.bahan.every((i) => sah.has(i)) &&
          Array.isArray(x.alat) && x.alat.every((i) => int(i, 1, 1e6))
        if (!ok) throw galat(400, 'Ada langkah yang tidak valid.')
      }
    }

    await transaksi(db, async (tx) => {
      await tx.query(`UPDATE recipes SET ${[...set, "status='draf'", 'diubah_pada=now()'].join(', ')} WHERE id=$1`, nilai)
      if ('alat' in b) {
        await tx.query('DELETE FROM recipe_tools WHERE recipe_id=$1', [id])
        for (const t of new Set(b.alat)) await tx.query('INSERT INTO recipe_tools (recipe_id, tool_id) VALUES ($1,$2)', [id, t])
      }
      if ('bahan' in b) {
        await tx.query('DELETE FROM recipe_ingredients WHERE recipe_id=$1', [id])
        for (const x of b.bahan) await tx.query('INSERT INTO recipe_ingredients VALUES ($1,$2,$3,$4)', [id, x.ingredient_id, x.jumlah, x.peran])
        // bahan yang dihapus dari resep juga hilang dari langkah
        await tx.query(
          `DELETE FROM step_ingredients WHERE step_id IN (SELECT id FROM recipe_steps WHERE recipe_id=$1)
             AND ingredient_id NOT IN (SELECT ingredient_id FROM recipe_ingredients WHERE recipe_id=$1)`,
          [id],
        )
      }
      if ('langkah' in b) {
        await tx.query('DELETE FROM recipe_steps WHERE recipe_id=$1', [id])
        for (const [i, l] of b.langkah.entries()) {
          const { rows: [s] } = await tx.query(
            'INSERT INTO recipe_steps (recipe_id, urutan, fase, foto_url, instruksi, timer_menit) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
            [id, i + 1, l.fase, l.foto_url ?? null, l.instruksi, l.timer_menit ?? null],
          )
          for (const ing of new Set(l.bahan))
            await tx.query('INSERT INTO step_ingredients SELECT $1, ingredient_id, jumlah FROM recipe_ingredients WHERE recipe_id=$2 AND ingredient_id=$3', [s.id, id, ing])
          for (const t of new Set(l.alat)) await tx.query('INSERT INTO step_tools (step_id, tool_id) SELECT $1, id FROM tools WHERE id=$2', [s.id, t])
        }
      }
    })
    res.json({ ok: true })
  })

  r.post('/resep/:id/validasi', async (req, res, next) => {
    if (!UUID.test(req.params.id)) return next()
    await milikDraf(req.params.id, req.user.id)
    res.json(await validasi(db, req.params.id))
  })

  // Kirim untuk ditinjau: hanya bila semua pemeriksaan lolos.
  r.post('/resep/:id/kirim', async (req, res, next) => {
    const { id } = req.params
    if (!UUID.test(id)) return next()
    await milikDraf(id, req.user.id)
    const v = await validasi(db, id)
    if (!v.ok) return res.status(422).json({ pesan: `${v.perlu_diperbaiki} hal perlu diperbaiki sebelum dikirim.`, ...v })
    await db.query("UPDATE recipes SET status='ditinjau', catatan_penolakan=NULL, ditinjau_pada=NULL, diubah_pada=now() WHERE id=$1", [id])
    res.json({ ok: true, status: 'ditinjau' })
  })

  // ---- Resep saya ----
  r.get('/resep-saya', async (req, res) => {
    const { status } = req.query
    if (status && !['draf', 'ditinjau', 'terbit', 'ditolak'].includes(status)) throw galat(400, 'Status tidak valid.')
    const { rows } = await db.query(
      `SELECT r.id, r.judul, r.foto_url, r.status, r.diubah_pada, r.ditinjau_pada, r.terbit_pada,
              (SELECT count(*)::int FROM recipe_steps s WHERE s.recipe_id = r.id) AS jumlah_langkah
       FROM recipes r WHERE r.penulis_id = $1 AND ($2::text IS NULL OR r.status::text = $2) ORDER BY r.diubah_pada DESC`,
      [req.user.id, status ?? null],
    )
    const jumlah = { draf: 0, ditinjau: 0, terbit: 0, ditolak: 0 }
    for (const x of (await db.query('SELECT status, count(*)::int AS n FROM recipes WHERE penulis_id=$1 GROUP BY status', [req.user.id])).rows) jumlah[x.status] = x.n
    res.json({ daftar: rows, jumlah })
  })

  r.get('/resep-saya/:id', async (req, res, next) => {
    if (!UUID.test(req.params.id)) return next()
    const d = await muatDraf(db, req.params.id)
    if (!d || d.penulis_id !== req.user.id) throw galat(404, 'Resep tidak ditemukan.')
    res.json(d)
  })

  r.delete('/resep-saya/:id', async (req, res, next) => {
    if (!UUID.test(req.params.id)) return next()
    await milikDraf(req.params.id, req.user.id)
    await db.query('DELETE FROM recipes WHERE id=$1', [req.params.id])
    res.status(204).end()
  })

  return r
}
