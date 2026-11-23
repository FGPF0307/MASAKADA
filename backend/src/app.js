import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { pool } from './db/pool.js'
import { auth } from './middleware/auth.js'
import { errorHandler, notFound } from './middleware/error.js'
import { buatAdmin } from './routes/admin.js'
import { buatAlat } from './routes/alat.js'
import { buatBagikan } from './routes/bagikan.js'
import { buatBahan } from './routes/bahan.js'
import { buatBisa } from './routes/bisa.js'
import { buatChefAI, buatPlus } from './routes/chefai.js'
import { buatPribadi } from './routes/pribadi.js'
import { buatLaporan } from './routes/laporan.js'
import { buatMitra } from './routes/mitra.js'
import { buatPantry } from './routes/pantry.js'
import { buatPencapaian } from './routes/pencapaian.js'
import { buatResep } from './routes/resep.js'
import { buatSaya } from './routes/saya.js'
import { buatPublik } from './routes/publik.js'
import { buatUnggah } from './routes/unggah.js'
import { unggahFoto } from './services/storage.js'

// db, auth, dan storage bisa diganti (dipakai test dengan Postgres memori, pengguna palsu, dan penyimpanan palsu).
export function buatApp({ db = pool, authMw = auth, storage = unggahFoto, buatAkun } = {}) {
  const app = express()
  app.use(cors({ origin: process.env.FRONTEND_URL ?? true }))
  app.use(express.json())

  app.get('/api/health', (_req, res) => res.json({ ok: true }))

  // Etalase resep untuk tamu (belum login).
  app.use('/api/publik', buatPublik(db, buatAkun))

  // Semua rute /api lain wajib login (spesifikasi bagian 12).
  app.use('/api', authMw)
  app.use('/api/saya', buatSaya(db))
  app.use('/api/bahan', buatBahan(db))
  app.use('/api/alat', buatAlat(db))
  app.use('/api/pantry', buatPantry(db))
  app.use('/api/resep', buatResep(db))
  app.use('/api/mitra', buatMitra(db))
  app.use('/api/laporan', buatLaporan(db))
  app.use('/api/unggah-foto', buatUnggah(storage))
  app.use('/api/admin', buatAdmin(db))
  app.use('/api', buatPencapaian(db)) // /pencapaian, /notifikasi
  app.use('/api', buatBagikan(db)) // /resep (POST/PATCH), /resep/:id/validasi|kirim, /resep-saya
  app.use('/api/plus', buatPlus(db))
  app.use('/api/chef-ai', buatChefAI(db))
  app.use('/api', buatPribadi(db)) // /favorit, /koleksi, /riwayat, /ringkasan-profil
  app.use('/api', buatBisa(db)) // /perencana, /workshop

  app.use(notFound)
  app.use(errorHandler)
  return app
}

if (process.argv[1]?.endsWith('app.js')) {
  const port = process.env.PORT ?? 4000
  buatApp().listen(port, () => console.log(`MasakAda API di http://localhost:${port}`))
}
