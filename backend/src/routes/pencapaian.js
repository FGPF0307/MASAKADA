import { Router } from 'express'
import { galat } from '../middleware/error.js'
import { hitungProgres } from '../services/lencana.js'
import { LEVEL, levelDari } from '../services/level.js'

// /api/pencapaian, /api/pencapaian/riwayat-poin, /api/notifikasi (dalam aplikasi saja, tanpa push).
export function buatPencapaian(db) {
  const r = Router()

  r.get('/pencapaian', async (req, res) => {
    const { rows: [u] } = await db.query('SELECT poin FROM profiles WHERE id=$1', [req.user.id])
    if (!u) throw galat(404, 'Profil tidak ditemukan.')
    const [progres, lencana, bulan] = await Promise.all([
      hitungProgres(db, req.user.id),
      db.query(
        `SELECT b.kode, b.nama, b.deskripsi, b.target, ub.didapat_pada FROM badges b
         LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = $1 ORDER BY b.id`,
        [req.user.id],
      ),
      db.query("SELECT COALESCE(sum(poin),0)::int AS n FROM points_log WHERE user_id=$1 AND poin > 0 AND dibuat_pada >= date_trunc('month', now())", [req.user.id]),
    ])
    const level = levelDari(u.poin)
    const berikut = LEVEL.find((l) => l.ambang > u.poin) ?? null
    res.json({
      poin: u.poin, poin_bulan_ini: bulan.rows[0].n, level, berikutnya: berikut, poin_ke_berikutnya: berikut ? berikut.ambang - u.poin : 0,
      semua_level: LEVEL,
      lencana: lencana.rows.map((b) => ({ ...b, progres: Math.min(progres[b.kode] ?? 0, b.target), didapat: !!b.didapat_pada })),
    })
  })

  r.get('/pencapaian/riwayat-poin', async (req, res) => {
    const [daftar, total, bulan] = await Promise.all([
      db.query(
        `SELECT l.id, l.aksi, l.poin, l.dibuat_pada, l.recipe_id, r.judul FROM points_log l LEFT JOIN recipes r ON r.id = l.recipe_id
         WHERE l.user_id=$1 ORDER BY l.dibuat_pada DESC, l.id DESC LIMIT 200`,
        [req.user.id],
      ),
      db.query('SELECT COALESCE(sum(poin),0)::int AS n FROM points_log WHERE user_id=$1', [req.user.id]),
      db.query("SELECT COALESCE(sum(poin),0)::int AS n FROM points_log WHERE user_id=$1 AND dibuat_pada >= date_trunc('month', now())", [req.user.id]),
    ])
    res.json({ bulan_ini: bulan.rows[0].n, total: total.rows[0].n, daftar: daftar.rows })
  })

  r.get('/notifikasi', async (req, res) => {
    const { rows } = await db.query('SELECT id, jenis, judul, isi, tautan, dibaca, dibuat_pada FROM notifications WHERE user_id=$1 ORDER BY dibuat_pada DESC, id DESC LIMIT 100', [req.user.id])
    res.json({ belum_dibaca: rows.filter((n) => !n.dibaca).length, daftar: rows })
  })

  r.post('/notifikasi/baca-semua', async (req, res) => {
    await db.query('UPDATE notifications SET dibaca=true WHERE user_id=$1 AND NOT dibaca', [req.user.id])
    res.json({ ok: true })
  })

  r.post('/notifikasi/:id/baca', async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) throw galat(404, 'Notifikasi tidak ditemukan.')
    const { rowCount } = await db.query('UPDATE notifications SET dibaca=true WHERE id=$1 AND user_id=$2', [Number(req.params.id), req.user.id])
    if (!rowCount) throw galat(404, 'Notifikasi tidak ditemukan.')
    res.json({ ok: true })
  })

  return r
}
