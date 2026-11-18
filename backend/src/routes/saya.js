import { Router } from 'express'
import { pool } from '../db/pool.js'

export const saya = Router()

// Profil pengguna; dibuat otomatis saat pertama kali masuk.
saya.get('/', async (req, res) => {
  const { id, nama } = req.user
  await pool.query('INSERT INTO profiles (id, nama) VALUES ($1,$2) ON CONFLICT (id) DO NOTHING', [id, nama])
  const { rows: [profil] } = await pool.query('SELECT * FROM profiles WHERE id=$1', [id])
  res.json(profil)
})
