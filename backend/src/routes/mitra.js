import { Router } from 'express'

// Toko mitra (simulasi): hanya daftar, tidak ada pesanan sungguhan.
export function buatMitra(db) {
  const r = Router()
  r.get('/', async (_req, res) => {
    res.json((await db.query('SELECT id, nama, keterangan, tautan FROM partner_stores ORDER BY id')).rows)
  })
  return r
}
