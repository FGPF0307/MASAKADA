import { Router } from 'express'
import { galat } from '../middleware/error.js'

const SATUAN = ['g', 'ml', 'butir']
const KATEGORI = ['protein', 'sayur', 'karbohidrat', 'saus', 'susu', 'bumbu']

export function buatBahan(db) {
  const r = Router()
  const kolom = "id, nama, sinonim, kategori, satuan, (status <> 'baku') AS belum_baku"

  // Saran otomatis: nama dan sinonim, awal nama didahulukan. Bahan "menunggu" milik sendiri ikut tampil. Maks 10.
  r.get('/', async (req, res) => {
    const q = String(req.query.q ?? '').trim().toLowerCase()
    if (!q) return res.json([])
    const { rows } = await db.query(
      `SELECT ${kolom} FROM ingredients
       WHERE (status='baku' OR (status='menunggu' AND diajukan_oleh=$2))
         AND (lower(nama) LIKE '%'||$1||'%' OR EXISTS (SELECT 1 FROM unnest(sinonim) s WHERE lower(s) LIKE '%'||$1||'%'))
       ORDER BY (lower(nama) LIKE $1||'%') DESC, nama LIMIT 10`,
      [q, req.user.id],
    )
    res.json(rows)
  })

  // Bahan baru yang belum ada di daftar baku: status 'menunggu' sampai disetujui moderator.
  r.post('/', async (req, res) => {
    const { nama, sinonim = [], satuan, kategori } = req.body ?? {}
    const n = typeof nama === 'string' ? nama.trim() : ''
    if (n.length < 2 || n.length > 100) throw galat(400, 'Nama bahan harus 2–100 karakter.')
    if (!SATUAN.includes(satuan)) throw galat(400, 'Satuan harus g, ml, atau butir.')
    if (!KATEGORI.includes(kategori)) throw galat(400, 'Kategori tidak valid.')
    if (!Array.isArray(sinonim) || sinonim.length > 10 || sinonim.some((s) => typeof s !== 'string' || s.length > 100))
      throw galat(400, 'Nama lain tidak valid.')
    const lain = sinonim.map((s) => s.trim()).filter(Boolean)

    const { rows: ada } = await db.query(
      `SELECT nama FROM ingredients WHERE lower(nama)=lower($1) OR EXISTS (SELECT 1 FROM unnest(sinonim) s WHERE lower(s)=lower($1)) LIMIT 1`,
      [n],
    )
    if (ada.length) throw galat(409, `Bahan sudah ada di daftar: ${ada[0].nama}.`)

    const { rows } = await db.query(
      `INSERT INTO ingredients (nama, sinonim, kategori, satuan, status, diajukan_oleh)
       VALUES ($1,$2,$3,$4,'menunggu',$5) RETURNING ${kolom}`,
      [n, lain, kategori, satuan, req.user.id],
    )
    res.status(201).json(rows[0])
  })

  // Pilihan bahan pokok + status pilihan pengguna (default selalu terpilih dan terkunci).
  r.get('/pokok', async (req, res) => {
    const { rows } = await db.query(
      `SELECT i.id, i.nama, i.pokok_default AS terkunci,
              (i.pokok_default OR s.user_id IS NOT NULL) AS dipilih
       FROM ingredients i LEFT JOIN user_staples s ON s.ingredient_id=i.id AND s.user_id=$1
       WHERE i.bisa_pokok AND i.status='baku' ORDER BY i.pokok_default DESC, i.nama`,
      [req.user.id],
    )
    res.json(rows)
  })

  // Bahan dari resep yang baru dimasak (kosong sampai ada riwayat memasak).
  r.get('/baru-dipakai', async (req, res) => {
    const { rows } = await db.query(
      `SELECT id, nama, sinonim, kategori, satuan, false AS belum_baku FROM (
         SELECT i.id, i.nama, i.sinonim, i.kategori, i.satuan, max(h.dimasak_pada) AS terakhir
         FROM cook_history h JOIN cook_history_items ci ON ci.cook_id=h.id JOIN ingredients i ON i.id=ci.ingredient_id
         WHERE h.user_id=$1 AND i.status='baku' GROUP BY i.id ORDER BY terakhir DESC LIMIT 8
       ) x ORDER BY terakhir DESC`,
      [req.user.id],
    )
    res.json(rows)
  })

  r.get('/kategori/:kategori', async (req, res) => {
    const { rows } = await db.query(`SELECT ${kolom} FROM ingredients WHERE status='baku' AND kategori=$1 ORDER BY nama`, [req.params.kategori])
    res.json(rows)
  })

  r.get('/:id', async (req, res, next) => {
    if (!/^\d+$/.test(req.params.id)) return next()
    const { rows } = await db.query(
      `SELECT ${kolom} FROM ingredients WHERE id=$1 AND (status='baku' OR diajukan_oleh=$2)`,
      [Number(req.params.id), req.user.id],
    )
    if (!rows.length) throw galat(404, 'Bahan tidak ditemukan.')
    res.json(rows[0])
  })

  return r
}
