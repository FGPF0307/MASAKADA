import { Router } from 'express'
import { transaksi } from '../db/transaksi.js'
import { galat } from '../middleware/error.js'
import { muatDraf } from '../services/draf.js'
import { cekLencana } from '../services/lencana.js'
import { POIN, beri, cabut } from '../services/points.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SATUAN = ['g', 'ml', 'butir']
const KATEGORI = ['protein', 'sayur', 'karbohidrat', 'saus', 'susu', 'bumbu']
const NOMOR = /^\d+$/

// Antrean moderasi: hanya role = admin. Poin untuk penulis menyusul di Langkah 11 (gamifikasi).
export function buatAdmin(db) {
  const r = Router()

  r.use(async (req, _res, next) => {
    const { rows } = await db.query("SELECT 1 FROM profiles WHERE id=$1 AND role='admin'", [req.user.id])
    next(rows.length ? undefined : galat(403, 'Halaman ini hanya untuk moderator.'))
  })

  const notif = (db2, userId, jenis, judul, isi, tautan) =>
    db2.query('INSERT INTO notifications (user_id, jenis, judul, isi, tautan) VALUES ($1,$2,$3,$4,$5)', [userId, jenis, judul, isi, tautan])

  r.get('/antrean', async (_req, res) => {
    const [resep, bahan, laporan] = await Promise.all([
      db.query(
        `SELECT r.id, r.judul, r.foto_url, p.nama AS penulis, r.diubah_pada FROM recipes r JOIN profiles p ON p.id = r.penulis_id
         WHERE r.status='ditinjau' ORDER BY r.diubah_pada`,
      ),
      db.query(
        `SELECT i.id, i.nama, i.sinonim, i.kategori, i.satuan, p.nama AS pengaju FROM ingredients i LEFT JOIN profiles p ON p.id = i.diajukan_oleh
         WHERE i.status='menunggu' ORDER BY i.id`,
      ),
      db.query(
        `SELECT l.id, l.alasan, l.catatan, l.dibuat_pada, l.recipe_id, l.comment_id, COALESCE(r.judul, r2.judul) AS judul_resep, c.isi AS isi_komentar
         FROM reports l LEFT JOIN recipes r ON r.id = l.recipe_id LEFT JOIN comments c ON c.id = l.comment_id LEFT JOIN recipes r2 ON r2.id = c.recipe_id
         WHERE l.status='baru' ORDER BY l.dibuat_pada`,
      ),
    ])
    res.json({ resep: resep.rows, bahan: bahan.rows, laporan: laporan.rows })
  })

  r.get('/resep/:id', async (req, res, next) => {
    if (!UUID.test(req.params.id)) return next()
    const d = await muatDraf(db, req.params.id)
    if (!d) throw galat(404, 'Resep tidak ditemukan.')
    res.json(d)
  })

  const ditinjau = async (id) => {
    const { rows: [rc] } = await db.query("SELECT id, judul, penulis_id FROM recipes WHERE id=$1 AND status='ditinjau'", [id])
    if (!rc) throw galat(404, 'Resep tidak ada di antrean tinjauan.')
    return rc
  }

  r.post('/resep/:id/setujui', async (req, res, next) => {
    if (!UUID.test(req.params.id)) return next()
    const rc = await ditinjau(req.params.id)
    const { rows: [{ n }] } = await db.query(
      "SELECT count(*)::int AS n FROM recipe_ingredients ri JOIN ingredients i ON i.id = ri.ingredient_id WHERE ri.recipe_id=$1 AND i.status <> 'baku'",
      [rc.id],
    )
    if (n) throw galat(409, 'Resep memakai bahan baru yang belum disetujui. Setujui atau gabungkan bahannya dulu.')
    await transaksi(db, async (tx) => {
      await tx.query("UPDATE recipes SET status='terbit', terbit_pada=now(), ditinjau_pada=now(), catatan_penolakan=NULL WHERE id=$1", [rc.id])
      const poin = await beri(tx, rc.penulis_id, rc.id, 'resep_terbit', POIN.terbit)
      await notif(tx, rc.penulis_id, 'resep_terbit', 'Resepmu sudah terbit!', `${rc.judul} sekarang bisa ditemukan oleh semua pengguna. +${poin} poin.`, `/resep-saya/${rc.id}`)
      await cekLencana(tx, rc.penulis_id)
    })
    res.json({ ok: true })
  })

  // catatan: [{judul, isi}] — alasan per poin, dinomori server.
  r.post('/resep/:id/tolak', async (req, res, next) => {
    if (!UUID.test(req.params.id)) return next()
    const rc = await ditinjau(req.params.id)
    const { catatan } = req.body ?? {}
    if (!Array.isArray(catatan) || !catatan.length || catatan.length > 20 ||
        catatan.some((c) => typeof c?.judul !== 'string' || !c.judul.trim() || c.judul.length > 150 || (c.isi != null && (typeof c.isi !== 'string' || c.isi.length > 500))))
      throw galat(400, 'Tulis minimal satu hal yang perlu diperbaiki.')
    const berkas = catatan.map((c, i) => ({ no: i + 1, judul: c.judul.trim(), isi: c.isi?.trim() ?? '' }))
    await transaksi(db, async (tx) => {
      await tx.query("UPDATE recipes SET status='ditolak', ditinjau_pada=now(), catatan_penolakan=$2 WHERE id=$1", [rc.id, JSON.stringify(berkas)])
      await notif(tx, rc.penulis_id, 'resep_ditolak', 'Resepmu perlu perubahan', `${rc.judul}: perbaiki ${berkas.length} hal lalu kirim ulang.`, `/resep-saya/${rc.id}`)
    })
    res.json({ ok: true })
  })

  // ---- Bahan baru ----
  const menunggu = async (id) => {
    if (!NOMOR.test(id)) throw galat(404, 'Bahan tidak ditemukan.')
    const { rows: [b] } = await db.query("SELECT id, nama, diajukan_oleh FROM ingredients WHERE id=$1 AND status='menunggu'", [Number(id)])
    if (!b) throw galat(404, 'Bahan tidak ada di antrean.')
    return b
  }

  r.post('/bahan/:id/setujui', async (req, res) => {
    const b = await menunggu(req.params.id)
    const { nama = b.nama, satuan, kategori, sinonim } = req.body ?? {}
    if (typeof nama !== 'string' || nama.trim().length < 2 || nama.length > 100) throw galat(400, 'Nama bahan harus 2–100 karakter.')
    if (satuan !== undefined && !SATUAN.includes(satuan)) throw galat(400, 'Satuan harus g, ml, atau butir.')
    if (kategori !== undefined && !KATEGORI.includes(kategori)) throw galat(400, 'Kategori tidak valid.')
    if (sinonim !== undefined && (!Array.isArray(sinonim) || sinonim.length > 10 || sinonim.some((s) => typeof s !== 'string' || s.length > 100))) throw galat(400, 'Nama lain tidak valid.')
    const { rows: ada } = await db.query('SELECT 1 FROM ingredients WHERE lower(nama)=lower($1) AND id <> $2', [nama.trim(), b.id])
    if (ada.length) throw galat(409, 'Sudah ada bahan baku dengan nama itu. Gabungkan saja.')
    await transaksi(db, async (tx) => {
      await tx.query(
        `UPDATE ingredients SET status='baku', nama=$2, satuan=COALESCE($3::satuan, satuan), kategori=COALESCE($4, kategori), sinonim=COALESCE($5::text[], sinonim) WHERE id=$1`,
        [b.id, nama.trim(), satuan ?? null, kategori ?? null, sinonim?.map((s) => s.trim()).filter(Boolean) ?? null],
      )
      if (b.diajukan_oleh) await notif(tx, b.diajukan_oleh, 'bahan_disetujui', 'Bahan baru disetujui', `${nama.trim()} sekarang ada di daftar bahan MasakAda.`, '/pantry')
    })
    res.json({ ok: true })
  })

  // Gabungkan ke bahan baku yang sudah ada: semua pemakaian dipindah, namanya jadi sinonim.
  r.post('/bahan/:id/gabung', async (req, res) => {
    const b = await menunggu(req.params.id)
    const ke = req.body?.ke_id
    if (!Number.isInteger(ke)) throw galat(400, 'Pilih bahan tujuan.')
    await transaksi(db, async (tx) => {
      const { rows: [t] } = await tx.query("SELECT id FROM ingredients WHERE id=$1 AND status='baku'", [ke])
      if (!t) throw galat(404, 'Bahan tujuan tidak ditemukan.')
      await tx.query('DELETE FROM recipe_ingredients o USING recipe_ingredients n WHERE o.ingredient_id=$1 AND n.ingredient_id=$2 AND n.recipe_id=o.recipe_id', [b.id, ke])
      await tx.query('UPDATE recipe_ingredients SET ingredient_id=$2 WHERE ingredient_id=$1', [b.id, ke])
      await tx.query('DELETE FROM step_ingredients o USING step_ingredients n WHERE o.ingredient_id=$1 AND n.ingredient_id=$2 AND n.step_id=o.step_id', [b.id, ke])
      await tx.query('UPDATE step_ingredients SET ingredient_id=$2 WHERE ingredient_id=$1', [b.id, ke])
      await tx.query(
        `INSERT INTO pantry_items (user_id, ingredient_id, jumlah, tempat) SELECT user_id, $2, jumlah, tempat FROM pantry_items WHERE ingredient_id=$1
         ON CONFLICT (user_id, ingredient_id) DO UPDATE SET jumlah = pantry_items.jumlah + EXCLUDED.jumlah`,
        [b.id, ke],
      )
      await tx.query('DELETE FROM pantry_items WHERE ingredient_id=$1', [b.id])
      await tx.query('UPDATE ingredients SET sinonim = array_append(sinonim, $2) WHERE id=$1 AND NOT ($2 = ANY(sinonim))', [ke, b.nama])
      await tx.query('DELETE FROM ingredients WHERE id=$1', [b.id])
      if (b.diajukan_oleh) await notif(tx, b.diajukan_oleh, 'bahan_disetujui', 'Bahan baru digabungkan', `${b.nama} digabungkan dengan bahan yang sudah ada di daftar.`, '/pantry')
    })
    res.json({ ok: true })
  })

  r.post('/bahan/:id/tolak', async (req, res) => {
    const b = await menunggu(req.params.id)
    await db.query("UPDATE ingredients SET status='ditolak' WHERE id=$1", [b.id])
    res.json({ ok: true })
  })

  // ---- Laporan ----
  r.post('/laporan/:id/selesai', async (req, res) => {
    if (!NOMOR.test(req.params.id)) throw galat(404, 'Laporan tidak ditemukan.')
    const { sembunyikan_komentar = false, turunkan_resep = false } = req.body ?? {}
    const { rows: [l] } = await db.query("SELECT id, recipe_id, comment_id FROM reports WHERE id=$1 AND status='baru'", [Number(req.params.id)])
    if (!l) throw galat(404, 'Laporan tidak ditemukan.')
    await transaksi(db, async (tx) => {
      if (sembunyikan_komentar === true && l.comment_id) await tx.query('UPDATE comments SET disembunyikan=true WHERE id=$1', [l.comment_id])
      if (turunkan_resep === true && l.recipe_id) {
        const { rows: [turun] } = await tx.query(
          "UPDATE recipes SET status='ditolak', catatan_penolakan=$2 WHERE id=$1 AND status='terbit' RETURNING penulis_id",
          [l.recipe_id, JSON.stringify([{ no: 1, judul: 'Diturunkan oleh moderator setelah laporan', isi: '' }])],
        )
        if (turun) await cabut(tx, turun.penulis_id, l.recipe_id) // poin dari resep ini dicabut
      }
      await tx.query("UPDATE reports SET status='selesai' WHERE id=$1", [l.id])
    })
    res.json({ ok: true })
  })

  return r
}
