import { Router } from 'express'
import { galat } from '../middleware/error.js'

const KEAHLIAN = ['pemula', 'menengah', 'mahir']
const bool = (v) => typeof v === 'boolean'

// Kolom profil yang boleh diubah pengguna + validasinya.
const BOLEH = {
  nama: (v) => typeof v === 'string' && v.trim().length >= 1 && v.length <= 100,
  avatar_url: (v) => v === null || typeof v === 'string',
  level_keahlian: (v) => KEAHLIAN.includes(v),
  porsi_default: (v) => Number.isInteger(v) && v >= 1 && v <= 20,
  tampilkan_kurang1: bool,
  notif_tinjauan: bool,
}

export function buatSaya(db) {
  const saya = Router()

  // Profil pengguna; dibuat otomatis saat pertama kali masuk.
  const ambil = async ({ id, nama }) => {
    await db.query('INSERT INTO profiles (id, nama) VALUES ($1,$2) ON CONFLICT (id) DO NOTHING', [id, nama])
    await db.query("UPDATE profiles SET paket='gratis' WHERE id=$1 AND paket='plus' AND plus_sampai < now()", [id]) // percobaan/langganan berakhir
    return (await db.query('SELECT * FROM profiles WHERE id=$1', [id])).rows[0]
  }

  saya.get('/', async (req, res) => res.json(await ambil(req.user)))

  saya.patch('/', async (req, res) => {
    const body = req.body ?? {}
    const kolom = Object.keys(body)
    if (!kolom.length) throw galat(400, 'Tidak ada yang diubah.')
    for (const k of kolom) if (!BOLEH[k]?.(body[k])) throw galat(400, `Nilai "${k}" tidak valid.`)
    await ambil(req.user)
    const set = kolom.map((k, i) => `${k}=$${i + 2}`).join(', ')
    const { rows } = await db.query(`UPDATE profiles SET ${set} WHERE id=$1 RETURNING *`, [req.user.id, ...kolom.map((k) => body[k])])
    res.json(rows[0])
  })

  // Alat: daftar penuh [{tool_id, punya}]; yang tidak disebut tidak berubah.
  saya.put('/alat', async (req, res) => {
    const daftar = req.body
    if (!Array.isArray(daftar) || daftar.some((a) => !Number.isInteger(a?.tool_id) || !bool(a.punya)))
      throw galat(400, 'Daftar alat tidak valid.')
    await ambil(req.user)
    await db.query(
      `INSERT INTO user_tools (user_id, tool_id, punya)
       SELECT $1, x.t, x.p FROM unnest($2::int[], $3::bool[]) AS x(t, p) JOIN tools ON tools.id = x.t
       ON CONFLICT (user_id, tool_id) DO UPDATE SET punya = EXCLUDED.punya`,
      [req.user.id, daftar.map((a) => a.tool_id), daftar.map((a) => a.punya)],
    )
    res.json({ ok: true })
  })

  // Bahan pokok: mengganti seluruh pilihan. Bahan pokok default (air, garam, minyak) selalu ikut.
  saya.put('/bahan-pokok', async (req, res) => {
    const ids = req.body
    if (!Array.isArray(ids) || ids.some((i) => !Number.isInteger(i))) throw galat(400, 'Daftar bahan pokok tidak valid.')
    await ambil(req.user)
    await db.query(
      `WITH pilih AS (
         SELECT id FROM ingredients WHERE bisa_pokok AND status='baku' AND (id = ANY($2::int[]) OR pokok_default)
       ), hapus AS (
         DELETE FROM user_staples WHERE user_id=$1 AND ingredient_id NOT IN (SELECT id FROM pilih)
       )
       INSERT INTO user_staples (user_id, ingredient_id) SELECT $1, id FROM pilih ON CONFLICT DO NOTHING`,
      [req.user.id, ids],
    )
    res.json({ ok: true })
  })

  saya.post('/setup-selesai', async (req, res) => {
    await ambil(req.user)
    res.json((await db.query('UPDATE profiles SET setup_selesai=true WHERE id=$1 RETURNING *', [req.user.id])).rows[0])
  })

  return saya
}
