import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { pool } from './db/pool.js'
import { auth } from './middleware/auth.js'
import { errorHandler, notFound } from './middleware/error.js'
import { buatAlat } from './routes/alat.js'
import { buatBahan } from './routes/bahan.js'
import { buatMitra } from './routes/mitra.js'
import { buatPantry } from './routes/pantry.js'
import { buatResep } from './routes/resep.js'
import { buatSaya } from './routes/saya.js'

// db dan auth bisa diganti (dipakai test dengan Postgres memori dan pengguna palsu).
export function buatApp({ db = pool, authMw = auth } = {}) {
  const app = express()
  app.use(cors({ origin: process.env.FRONTEND_URL ?? true }))
  app.use(express.json())

  app.get('/api/health', (_req, res) => res.json({ ok: true }))

  // Semua rute /api lain wajib login (spesifikasi bagian 12).
  app.use('/api', authMw)
  app.use('/api/saya', buatSaya(db))
  app.use('/api/bahan', buatBahan(db))
  app.use('/api/alat', buatAlat(db))
  app.use('/api/pantry', buatPantry(db))
  app.use('/api/resep', buatResep(db))
  app.use('/api/mitra', buatMitra(db))

  app.use(notFound)
  app.use(errorHandler)
  return app
}

if (process.argv[1]?.endsWith('app.js')) {
  const port = process.env.PORT ?? 4000
  buatApp().listen(port, () => console.log(`MasakAda API di http://localhost:${port}`))
}
