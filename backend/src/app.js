import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { auth } from './middleware/auth.js'
import { errorHandler, notFound } from './middleware/error.js'
import { saya } from './routes/saya.js'

export const app = express()
app.use(cors({ origin: process.env.FRONTEND_URL ?? true }))
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// Semua rute /api lain wajib login (spesifikasi bagian 12).
app.use('/api', auth)
app.use('/api/saya', saya)

app.use(notFound)
app.use(errorHandler)

if (process.argv[1]?.endsWith('app.js')) {
  const port = process.env.PORT ?? 4000
  app.listen(port, () => console.log(`MasakAda API di http://localhost:${port}`))
}
