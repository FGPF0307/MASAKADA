import { Router } from 'express'
import { galat } from '../middleware/error.js'

const TEMPAT = ['kulkas', 'freezer', 'suhu_ruang']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const jumlahValid = (v, min) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= 100000

export function buatPantry(db) {
  const r = Router()
  const pilih = `p.id, p.ingredient_id, i.nama, i.sinonim, i.kategori, i.satuan, (i.status <> 'baku') AS belum_baku,
                 p.jumlah::float AS jumlah, p.tempat`

  // Bahan dengan jumlah 0 tidak tampil.
  r.get('/', async (req, res) => {
    const { tempat } = req.query
    if (tempat && !TEMPAT.includes(tempat)) throw galat(400, 'Tempat simpan tidak valid.')
    const { rows } = await db.query(
      `SELECT ${pilih} FROM pantry_items p JOIN ingredients i ON i.id=p.ingredient_id
       WHERE p.user_id=$1 AND p.jumlah>0 AND ($2::text IS NULL OR p.tempat::text=$2) ORDER BY i.nama`,
      [req.user.id, tempat ?? null],
    )
    res.json(rows)
  })

  // Upsert: jumlah ditambahkan ke yang sudah ada. Bahan baku, atau bahan "menunggu" yang diajukan pengguna sendiri.
  r.post('/', async (req, res) => {
    const { ingredient_id, jumlah, tempat = 'kulkas' } = req.body ?? {}
    if (!Number.isInteger(ingredient_id)) throw galat(400, 'Bahan tidak valid.')
    if (!jumlahValid(jumlah, Number.MIN_VALUE)) throw galat(400, 'Jumlah harus berupa angka lebih dari 0.')
    if (!TEMPAT.includes(tempat)) throw galat(400, 'Tempat simpan tidak valid.')
    const { rows } = await db.query(
      `INSERT INTO pantry_items (user_id, ingredient_id, jumlah, tempat)
       SELECT $1, i.id, $3, $4 FROM ingredients i
       WHERE i.id=$2 AND (i.status='baku' OR (i.status='menunggu' AND i.diajukan_oleh=$1))
       ON CONFLICT (user_id, ingredient_id)
       DO UPDATE SET jumlah = pantry_items.jumlah + EXCLUDED.jumlah, tempat = EXCLUDED.tempat, diubah_pada = now()
       RETURNING id, ingredient_id, jumlah::float AS jumlah, tempat`,
      [req.user.id, ingredient_id, jumlah, tempat],
    )
    if (!rows.length) throw galat(404, 'Bahan tidak ditemukan.')
    res.status(201).json(rows[0])
  })

  // Rute dengan :id — hanya milik pengguna sendiri.
  r.use('/:id', (req, _res, next) => (UUID.test(req.params.id) ? next() : next(galat(404, 'Bahan di pantry tidak ditemukan.'))))

  r.get('/:id', async (req, res) => {
    const { rows } = await db.query(
      `SELECT ${pilih} FROM pantry_items p JOIN ingredients i ON i.id=p.ingredient_id WHERE p.id=$1 AND p.user_id=$2`,
      [req.params.id, req.user.id],
    )
    if (!rows.length) throw galat(404, 'Bahan di pantry tidak ditemukan.')
    res.json(rows[0])
  })

  // Mengatur jumlah (menggantikan, bukan menambah) dan/atau tempat simpan.
  r.patch('/:id', async (req, res) => {
    const { jumlah, tempat } = req.body ?? {}
    if (jumlah === undefined && tempat === undefined) throw galat(400, 'Tidak ada yang diubah.')
    if (jumlah !== undefined && !jumlahValid(jumlah, 0)) throw galat(400, 'Jumlah harus berupa angka 0 atau lebih.')
    if (tempat !== undefined && !TEMPAT.includes(tempat)) throw galat(400, 'Tempat simpan tidak valid.')
    const { rows } = await db.query(
      `UPDATE pantry_items SET jumlah=COALESCE($3, jumlah), tempat=COALESCE($4::tempat_simpan, tempat), diubah_pada=now()
       WHERE id=$1 AND user_id=$2 RETURNING id, ingredient_id, jumlah::float AS jumlah, tempat`,
      [req.params.id, req.user.id, jumlah ?? null, tempat ?? null],
    )
    if (!rows.length) throw galat(404, 'Bahan di pantry tidak ditemukan.')
    res.json(rows[0])
  })

  r.delete('/:id', async (req, res) => {
    const { rowCount } = await db.query('DELETE FROM pantry_items WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id])
    if (!rowCount) throw galat(404, 'Bahan di pantry tidak ditemukan.')
    res.status(204).end()
  })

  return r
}
