import { Router } from 'express'
import { galat } from '../middleware/error.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const ALASAN = [
  'Instruksi tidak aman',
  'Takaran salah atau tidak jelas',
  'Saran pengganti buruk',
  'Disalin dari sumber lain',
  'Foto atau teks tidak pantas',
  'Spam',
  'Lainnya',
]

// Melaporkan resep atau komentar. Moderator meninjau di halaman admin (Langkah 10); pelapor tidak ditampilkan ke penulis.
export function buatLaporan(db) {
  const r = Router()
  r.post('/', async (req, res) => {
    const { recipe_id, comment_id, alasan, catatan } = req.body ?? {}
    if (!!recipe_id === !!comment_id) throw galat(400, 'Laporkan satu resep atau satu komentar.')
    const target = recipe_id ?? comment_id
    if (typeof target !== 'string' || !UUID.test(target)) throw galat(400, 'Yang dilaporkan tidak valid.')
    if (!ALASAN.includes(alasan)) throw galat(400, 'Pilih alasan laporan.')
    if (catatan !== undefined && (typeof catatan !== 'string' || catatan.length > 500)) throw galat(400, 'Catatan maksimal 500 karakter.')

    const { rows } = await db.query(
      recipe_id
        ? "SELECT 1 FROM recipes WHERE id=$1 AND status='terbit'"
        : 'SELECT 1 FROM comments WHERE id=$1 AND NOT disembunyikan',
      [target],
    )
    if (!rows.length) throw galat(404, 'Yang dilaporkan tidak ditemukan.')
    await db.query('INSERT INTO reports (pelapor_id, recipe_id, comment_id, alasan, catatan) VALUES ($1,$2,$3,$4,$5)', [
      req.user.id, recipe_id ?? null, comment_id ?? null, alasan, catatan?.trim() || null,
    ])
    res.status(201).json({ ok: true })
  })
  return r
}
