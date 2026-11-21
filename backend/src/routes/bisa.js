import { Router } from 'express'
import { transaksi } from '../db/transaksi.js'
import { galat } from '../middleware/error.js'
import { cekLencana } from '../services/lencana.js'
import { adalahPlus, awalPeriode, pakaiKuota, sisaKuota, wajibPlus } from '../services/kuota.js'
import { bahanDulu, hitungResep, tentukanStatus } from '../services/matching.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const METODE = ['ewallet', 'va', 'qris']
const WIB = 7 * 3600e3
const tanggalWib = (d) => new Date(d.getTime() + WIB).toISOString().slice(0, 10)

// Harga tiket untukmu: Plus mendapat 1 tiket gratis per bulan, selebihnya diskon 50%.
export function tiketUntuk(plus, harga, gratisTerpakai) {
  if (harga === 0) return { jenis: 'reguler', harga: 0 }
  if (plus && !gratisTerpakai) return { jenis: 'plus', harga: 0 }
  return { jenis: 'reguler', harga: plus ? Math.round(harga / 2) : harga }
}

// Perencana menu mingguan (Plus) dan workshop (simulasi) — spesifikasi 8.10 dan 8.12.
export function buatBisa(db) {
  const r = Router()
  const porsiDefault = async (uid) => (await db.query('SELECT porsi_default FROM profiles WHERE id=$1', [uid])).rows[0]?.porsi_default ?? 1

  // ---- Perencana menu ----
  const bacaRencana = async (uid) => {
    const mulai = tanggalWib(awalPeriode('minggu'))
    const [{ rows }, kuota, { resep }] = await Promise.all([
      db.query('SELECT hari, waktu_makan, recipe_id FROM meal_plans WHERE user_id=$1 AND minggu_mulai=$2::date', [uid, mulai]),
      sisaKuota(db, uid, 'rencana'),
      porsiDefault(uid).then((p) => hitungResep(db, uid, p)),
    ])
    const per = new Map(resep.map((x) => [x.id, x]))
    const slot = rows
      .map((s) => ({ hari: s.hari, waktu_makan: s.waktu_makan, resep: per.get(s.recipe_id) ?? null }))
      .sort((a, b) => a.hari - b.hari || (a.waktu_makan === 'siang' ? -1 : 1))
    const unik = [...new Map(slot.filter((s) => s.resep).map((s) => [s.resep.id, s.resep])).values()]
    return {
      ada: rows.length > 0, minggu_mulai: mulai, slot, kuota,
      bahan_dipakai: unik.reduce((n, x) => n + x.bahan_pantry_terpakai, 0),
      bahan_kurang: [...new Set(unik.flatMap((x) => x.bahan_kurang.map((b) => b.nama)))],
    }
  }
  r.get('/perencana', async (req, res) => {
    await wajibPlus(db, req.user.id)
    res.json(await bacaRencana(req.user.id))
  })

  // Membuat rencana minggu ini, atau membuat ulang (kuota 3 per minggu: 1 rencana + 2 buat ulang).
  r.post('/perencana/buat-ulang', async (req, res) => {
    await wajibPlus(db, req.user.id)
    const { resep } = await hitungResep(db, req.user.id, await porsiDefault(req.user.id))
    const urut = resep.filter((x) => !x.butuh_alat_lain).sort((a, b) => a.jumlah_kurang - b.jumlah_kurang || bahanDulu(a, b))
    if (!urut.length) throw galat(404, 'Belum ada resep yang cocok untuk dijadwalkan.')
    const kuota = await pakaiKuota(db, req.user.id, 'rencana')
    const geser = (((kuota.terpakai - 1) * 3) % urut.length) // tiap buat ulang menggeser pilihan
    const pool = [...urut.slice(geser), ...urut.slice(0, geser)]
    const mulai = tanggalWib(awalPeriode('minggu'))
    await transaksi(db, async (tx) => {
      await tx.query('DELETE FROM meal_plans WHERE user_id=$1 AND minggu_mulai=$2::date', [req.user.id, mulai])
      for (let i = 0; i < 14; i++)
        await tx.query('INSERT INTO meal_plans (user_id, minggu_mulai, hari, waktu_makan, recipe_id) VALUES ($1,$2::date,$3,$4,$5)', [req.user.id, mulai, Math.floor(i / 2) + 1, i % 2 ? 'malam' : 'siang', pool[i % pool.length].id])
    })
    res.status(201).json(await bacaRencana(req.user.id))
  })

  // Mengganti satu menu secara manual ("Ketuk menu untuk menggantinya").
  r.put('/perencana/slot', async (req, res) => {
    await wajibPlus(db, req.user.id)
    const { hari, waktu_makan: waktu, recipe_id: rid } = req.body ?? {}
    if (!Number.isInteger(hari) || hari < 1 || hari > 7 || !['siang', 'malam'].includes(waktu) || !UUID.test(String(rid))) throw galat(400, 'Data menu tidak valid.')
    if (!(await db.query("SELECT 1 FROM recipes WHERE id=$1 AND status='terbit'", [rid])).rows.length) throw galat(404, 'Resep tidak ditemukan.')
    const { rowCount } = await db.query('UPDATE meal_plans SET recipe_id=$5 WHERE user_id=$1 AND minggu_mulai=$2::date AND hari=$3 AND waktu_makan=$4', [req.user.id, tanggalWib(awalPeriode('minggu')), hari, waktu, rid])
    if (!rowCount) throw galat(404, 'Buat rencana minggu ini dulu.')
    res.json(await bacaRencana(req.user.id))
  })

  // ---- Workshop ----
  const gratisTerpakai = async (uid, mulai) =>
    (await db.query(
      `SELECT 1 FROM workshop_registrations g JOIN workshops w ON w.id=g.workshop_id
       WHERE g.user_id=$1 AND g.jenis_tiket='plus' AND date_trunc('month', w.mulai + interval '7 hours') = date_trunc('month', $2::timestamptz + interval '7 hours')`,
      [uid, mulai],
    )).rows.length > 0

  const cekPantry = async (uid, wid) => {
    const { rows } = await db.query(
      `SELECT i.nama, i.satuan, wi.jumlah::float AS butuh, (i.pokok_default OR s.user_id IS NOT NULL) AS pokok, COALESCE(p.jumlah,0)::float AS punya
       FROM workshop_ingredients wi JOIN ingredients i ON i.id=wi.ingredient_id
       LEFT JOIN user_staples s ON s.ingredient_id=wi.ingredient_id AND s.user_id=$1
       LEFT JOIN pantry_items p ON p.ingredient_id=wi.ingredient_id AND p.user_id=$1
       WHERE wi.workshop_id=$2 ORDER BY i.nama`,
      [uid, wid],
    )
    const bahan = rows.map((x) => ({ ...x, status: tentukanStatus({ ...x, peran: 'utama' }) }))
    return { ada: bahan.filter((b) => b.status === 'pokok' || b.status === 'ada').length, total: bahan.length, bahan }
  }

  const dasar = async (id) => {
    if (!UUID.test(id)) throw galat(404, 'Workshop tidak ditemukan.')
    const { rows: [w] } = await db.query(
      'SELECT w.*, (SELECT count(*) FROM workshop_registrations WHERE workshop_id=w.id)::int AS terisi FROM workshops w WHERE w.id=$1',
      [id],
    )
    if (!w) throw galat(404, 'Workshop tidak ditemukan.')
    return w
  }
  const bentuk = async (w, uid, plus) => ({
    id: w.id, judul: w.judul, tema: w.tema, deskripsi: w.deskripsi, pengisi: w.pengisi, mulai: w.mulai, durasi_menit: w.durasi_menit,
    harga: w.harga, kursi_sisa: Math.max(0, w.kursi - w.terisi), selesai: new Date(w.mulai).getTime() + w.durasi_menit * 60000 < Date.now(),
    tiket: tiketUntuk(plus, w.harga, plus && (await gratisTerpakai(uid, w.mulai))),
  })

  r.get('/workshop', async (req, res) => {
    const plus = await adalahPlus(db, req.user.id)
    const { rows } = await db.query(
      `SELECT w.*, (SELECT count(*) FROM workshop_registrations WHERE workshop_id=w.id)::int AS terisi,
              EXISTS (SELECT 1 FROM workshop_registrations g WHERE g.workshop_id=w.id AND g.user_id=$1) AS terdaftar
       FROM workshops w WHERE w.mulai > now() ORDER BY w.mulai`,
      [req.user.id],
    )
    res.json({ plus, workshop: await Promise.all(rows.map(async (w) => ({ ...(await bentuk(w, req.user.id, plus)), terdaftar: w.terdaftar }))) })
  })

  // Sebelum "/workshop/:id" agar "saya" tidak dibaca sebagai id.
  r.get('/workshop/saya', async (req, res) => {
    // Simulasi kehadiran: workshop yang sudah lewat dianggap dihadiri (lulus) → lencana Workshop Graduate.
    await transaksi(db, async (tx) => {
      const { rowCount } = await tx.query(
        `UPDATE workshop_registrations SET hadir=true WHERE user_id=$1 AND NOT hadir
         AND workshop_id IN (SELECT id FROM workshops WHERE mulai + durasi_menit * interval '1 minute' < now())`,
        [req.user.id],
      )
      if (rowCount) await cekLencana(tx, req.user.id)
    })
    const { rows } = await db.query(
      `SELECT w.id, w.judul, w.tema, w.mulai, w.durasi_menit, w.tautan_zoom, w.tautan_rekaman, g.kode_tiket, g.jenis_tiket, g.hadir
       FROM workshop_registrations g JOIN workshops w ON w.id=g.workshop_id WHERE g.user_id=$1 ORDER BY w.mulai`,
      [req.user.id],
    )
    const sekarang = Date.now()
    const tiket = await Promise.all(
      rows.map(async (x) => {
        const mulai = new Date(x.mulai).getTime()
        const selesai = mulai + x.durasi_menit * 60000 < sekarang
        return {
          id: x.id, judul: x.judul, tema: x.tema, mulai: x.mulai, kode_tiket: x.kode_tiket, jenis_tiket: x.jenis_tiket,
          selesai, lulus: x.hadir, bisa_gabung: !selesai && sekarang >= mulai - 10 * 60000,
          tautan_zoom: x.tautan_zoom ?? 'https://zoom.us/', tautan_rekaman: selesai ? (x.tautan_rekaman ?? '#') : null,
          pantry: selesai ? null : await cekPantry(req.user.id, x.id).then(({ ada, total }) => ({ ada, total })),
        }
      }),
    )
    res.json({ akan_datang: tiket.filter((x) => !x.selesai), selesai: tiket.filter((x) => x.selesai).reverse() })
  })

  r.get('/workshop/:id', async (req, res) => {
    const w = await dasar(req.params.id)
    const plus = await adalahPlus(db, req.user.id)
    const { rows: [reg] } = await db.query('SELECT kode_tiket FROM workshop_registrations WHERE user_id=$1 AND workshop_id=$2', [req.user.id, w.id])
    res.json({ ...(await bentuk(w, req.user.id, plus)), plus, terdaftar: !!reg, kode_tiket: reg?.kode_tiket ?? null, pantry: await cekPantry(req.user.id, w.id) })
  })

  // Simulasi: tidak ada pembayaran sungguhan.
  r.post('/workshop/:id/daftar', async (req, res) => {
    const w = await dasar(req.params.id)
    const plus = await adalahPlus(db, req.user.id)
    const { jenis_tiket: jenis, metode_bayar: metode } = req.body ?? {}
    if (new Date(w.mulai).getTime() + w.durasi_menit * 60000 < Date.now()) throw galat(400, 'Workshop ini sudah selesai.')
    if (w.terisi >= w.kursi) throw galat(409, 'Kursi sudah penuh.')
    const tiket = tiketUntuk(plus, w.harga, plus && (await gratisTerpakai(req.user.id, w.mulai)))
    if (jenis === 'plus' && tiket.jenis !== 'plus') throw galat(403, 'Tiket gratis Plus tidak tersedia untukmu.')
    if (tiket.harga > 0 && !METODE.includes(metode)) throw galat(400, 'Pilih metode pembayaran.')
    const kode = `MA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const { rowCount } = await db.query(
      'INSERT INTO workshop_registrations (user_id, workshop_id, kode_tiket, jenis_tiket) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
      [req.user.id, w.id, kode, tiket.jenis],
    )
    if (!rowCount) throw galat(409, 'Kamu sudah terdaftar di workshop ini.')
    res.status(201).json({ kode_tiket: kode, jenis_tiket: tiket.jenis, harga: tiket.harga })
  })

  return r
}
