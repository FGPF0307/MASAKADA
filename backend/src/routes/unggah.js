import express, { Router } from 'express'
import { galat } from '../middleware/error.js'
import { tipeGambarValid } from '../services/storage.js'

// POST /api/unggah-foto: isi permintaan = berkas gambar mentah (JPEG/PNG/WebP, maks 2 MB; browser mengompres dulu).
export function buatUnggah(storage) {
  const r = Router()
  r.post('/', express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '2mb' }), async (req, res) => {
    const tipe = (req.headers['content-type'] ?? '').split(';')[0]
    if (!Buffer.isBuffer(req.body) || !req.body.length) throw galat(415, 'Kirim foto berformat JPEG, PNG, atau WebP.')
    if (!tipeGambarValid(req.body, tipe)) throw galat(415, 'Berkas bukan gambar yang valid.')
    res.status(201).json({ url: await storage(req.body, tipe, req.user.id) })
  })
  return r
}
