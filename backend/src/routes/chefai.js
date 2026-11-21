import express, { Router } from 'express'
import { transaksi } from '../db/transaksi.js'
import { galat } from '../middleware/error.js'
import { jawabChat, modeMock, pindaiGambar, sarankanPengganti } from '../services/ai.js'
import { adalahPlus, pakaiKuota, sisaKuota, wajibPlus } from '../services/kuota.js'
import { hitungResep, urutkan } from '../services/matching.js'
import { tipeGambarValid } from '../services/storage.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TEMPAT = ['kulkas', 'freezer', 'suhu_ruang']
const bulat = (n) => Math.round(n * 100) / 100
const jumlahValid = (n, maks = 100000) => typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= maks

// Paket Plus (pembayaran disimulasikan) — spesifikasi 6.2.
export function buatPlus(db) {
  const r = Router()
  const status = async (userId) => {
    const [chat, substitusi, scan, rencana, { rows: [p] }] = await Promise.all([
      ...['chat', 'substitusi', 'scan', 'rencana'].map((f) => sisaKuota(db, userId, f)),
      db.query('SELECT paket, plus_sampai FROM profiles WHERE id=$1', [userId]),
    ])
    return { paket: p?.paket ?? 'gratis', plus_sampai: p?.plus_sampai ?? null, kuota: { chat, substitusi, scan, rencana } }
  }
  r.get('/status', async (req, res) => res.json(await status(req.user.id)))

  // Simulasi: tidak ada pembayaran. Percobaan gratis 7 hari.
  r.post('/aktifkan', async (req, res) => {
    if (!['bulanan', 'tahunan'].includes(req.body?.paket)) throw galat(400, 'Pilih paket bulanan atau tahunan.')
    if (await adalahPlus(db, req.user.id)) throw galat(409, 'Kamu sudah berlangganan Plus.')
    await db.query("UPDATE profiles SET paket='plus', plus_sampai = now() + interval '7 days' WHERE id=$1", [req.user.id])
    res.json(await status(req.user.id))
  })

  r.post('/batal', async (req, res) => {
    await db.query("UPDATE profiles SET paket='gratis', plus_sampai=NULL WHERE id=$1", [req.user.id])
    res.json(await status(req.user.id))
  })
  return r
}

// Chef AI: chat (gratis + Plus), substitusi, scan (Plus). Kuota dicek di server sebelum AI dipanggil.
export function buatChefAI(db) {
  const r = Router()

  const konteks = async (userId) => {
    const [pantry, alat] = await Promise.all([
      db.query('SELECT i.nama FROM pantry_items p JOIN ingredients i ON i.id=p.ingredient_id WHERE p.user_id=$1 AND p.jumlah>0 ORDER BY i.nama', [userId]),
      db.query('SELECT t.nama FROM user_tools u JOIN tools t ON t.id=u.tool_id WHERE u.user_id=$1 AND u.punya', [userId]),
    ])
    return { pantry: pantry.rows.map((x) => x.nama), alat: alat.rows.map((x) => x.nama) }
  }

  r.get('/riwayat', async (req, res) => {
    const { rows } = await db.query(
      `SELECT * FROM (SELECT id, peran, isi, dibuat_pada FROM ai_messages WHERE user_id=$1 ORDER BY dibuat_pada DESC, id DESC LIMIT 30) x ORDER BY dibuat_pada, id`,
      [req.user.id],
    )
    res.json({ pesan: rows, kuota: await sisaKuota(db, req.user.id, 'chat') })
  })

  r.post('/chat', async (req, res) => {
    const pesan = typeof req.body?.pesan === 'string' ? req.body.pesan.trim() : ''
    if (!pesan || pesan.length > 500) throw galat(400, 'Pertanyaan harus 1–500 karakter.')
    const kuota = await pakaiKuota(db, req.user.id, 'chat')
    let jawaban, kartu = [], mock = false
    if (/masak apa|bisa (aku )?masak|resep apa|rekomendasi/i.test(pesan)) {
      // Pertanyaan "masak apa?" dijawab dari matching pantry, tanpa AI.
      const porsi = (await db.query('SELECT porsi_default FROM profiles WHERE id=$1', [req.user.id])).rows[0]?.porsi_default ?? 1
      const { resep } = await hitungResep(db, req.user.id, porsi)
      kartu = urutkan(resep.filter((x) => x.jumlah_kurang === 0 && !x.butuh_alat_lain)).slice(0, 2).map((x) => ({ id: x.id, judul: x.judul, foto_url: x.foto_url, total: x.total }))
      jawaban = kartu.length ? 'Dari pantrymu, ini yang bisa kamu masak sekarang:' : 'Belum ada resep yang benar-benar siap dari pantrymu. Coba lihat "Kurang 1 bahan" di Beranda atau tambah bahan dulu.'
    } else {
      const { pantry, alat } = await konteks(req.user.id)
      const { rows: riwayat } = await db.query('SELECT peran, isi FROM (SELECT peran, isi, dibuat_pada, id FROM ai_messages WHERE user_id=$1 ORDER BY dibuat_pada DESC, id DESC LIMIT 6) x ORDER BY dibuat_pada, id', [req.user.id])
      ;({ hasil: jawaban, mock } = await jawabChat({ pesan, pantry, alat, riwayat }))
    }
    await db.query("INSERT INTO ai_messages (user_id, peran, isi) VALUES ($1,'user',$2)", [req.user.id, pesan])
    await db.query("INSERT INTO ai_messages (user_id, peran, isi, resep_terkait) VALUES ($1,'assistant',$2,$3)", [req.user.id, jawaban, kartu[0]?.id ?? null])
    res.json({ jawaban, kartu, kuota, mock })
  })

  // Substitusi (Plus, 5 per bulan): hasil divalidasi di server — hanya bahan baku, maks 2, takaran angka.
  r.post('/substitusi', async (req, res) => {
    const { recipe_id: rid, ingredient_id: iid } = req.body ?? {}
    if (!UUID.test(String(rid)) || !Number.isInteger(iid)) throw galat(400, 'Resep atau bahan tidak valid.')
    await wajibPlus(db, req.user.id)
    const { rows: [b] } = await db.query(
      `SELECT ri.jumlah::float AS jumlah, r.porsi, i.nama, i.satuan FROM recipe_ingredients ri
       JOIN recipes r ON r.id=ri.recipe_id AND r.status='terbit' JOIN ingredients i ON i.id=ri.ingredient_id
       WHERE ri.recipe_id=$1 AND ri.ingredient_id=$2`,
      [rid, iid],
    )
    if (!b) throw galat(404, 'Bahan itu tidak ada di resep ini.')
    const p = Number.isInteger(req.body.porsi) && req.body.porsi >= 1 && req.body.porsi <= 20 ? req.body.porsi : (await db.query('SELECT porsi_default FROM profiles WHERE id=$1', [req.user.id])).rows[0]?.porsi_default ?? 1
    const butuh = bulat((b.jumlah * p) / b.porsi)
    const { rows: kandidat } = await db.query(
      `SELECT i.id, i.nama, COALESCE(p.jumlah,0) > 0 AS ada FROM ingredients i LEFT JOIN pantry_items p ON p.ingredient_id=i.id AND p.user_id=$1
       WHERE i.status='baku' AND i.satuan=$2 AND i.id <> $3 AND i.id NOT IN (SELECT ingredient_id FROM recipe_ingredients WHERE recipe_id=$4)`,
      [req.user.id, b.satuan, iid, rid],
    )
    const kuota = await pakaiKuota(db, req.user.id, 'substitusi')
    const { hasil, mock } = await sarankanPengganti({ nama: b.nama, butuh, satuan: b.satuan, kandidat })
    const per = new Map(kandidat.map((k) => [k.id, k]))
    const pilihan = []
    for (const x of Array.isArray(hasil) ? hasil : []) {
      const k = per.get(x?.ingredient_id)
      if (!k || !jumlahValid(x.jumlah, butuh * 3) || pilihan.some((q) => q.ingredient_id === k.id)) continue
      pilihan.push({ ingredient_id: k.id, nama: k.nama, jumlah: bulat(x.jumlah), satuan: b.satuan, catatan: String(x.catatan ?? '').slice(0, 200), punya: k.ada })
      if (pilihan.length === 2) break
    }
    res.json({ bahan: { nama: b.nama, butuh, satuan: b.satuan }, pilihan, kuota, mock })
  })

  // Scan foto kulkas/rak (Plus, 30 per bulan). Hasil BELUM disimpan: pengguna mengonfirmasi dulu.
  r.post('/scan', express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '2mb' }), async (req, res) => {
    await wajibPlus(db, req.user.id)
    const tipe = (req.headers['content-type'] ?? '').split(';')[0]
    if (!Buffer.isBuffer(req.body) || !req.body.length) throw galat(415, 'Kirim foto berformat JPEG, PNG, atau WebP.')
    if (!tipeGambarValid(req.body, tipe)) throw galat(415, 'Berkas bukan gambar yang valid.')
    const kuota = await pakaiKuota(db, req.user.id, 'scan')
    const { rows: bahan } = await db.query("SELECT id, nama, satuan FROM ingredients WHERE status='baku'")
    const { hasil, mock } = await pindaiGambar({ gambar: req.body, tipe, bahan })
    const per = new Map(bahan.map((b) => [b.id, b]))
    const items = []
    for (const x of Array.isArray(hasil) ? hasil : []) {
      const b = per.get(x?.ingredient_id)
      if (!b || !jumlahValid(x.jumlah) || items.some((q) => q.ingredient_id === b.id)) continue
      items.push({ ingredient_id: b.id, nama: b.nama, satuan: b.satuan, jumlah: bulat(x.jumlah), yakin: x.yakin === true })
      if (items.length === 30) break
    }
    res.json({ items, kuota, mock })
  })

  // Menambahkan hasil scan yang sudah dicek pengguna ke pantry (jumlah ditambahkan ke stok yang ada).
  r.post('/scan/konfirmasi', async (req, res) => {
    const { tempat, items } = req.body ?? {}
    if (!TEMPAT.includes(tempat)) throw galat(400, 'Tempat simpan tidak valid.')
    if (!Array.isArray(items) || !items.length || items.length > 50 || items.some((x) => !Number.isInteger(x?.ingredient_id) || !jumlahValid(x.jumlah)))
      throw galat(400, 'Daftar bahan tidak valid.')
    const ids = [...new Set(items.map((x) => x.ingredient_id))]
    const { rows } = await db.query("SELECT id FROM ingredients WHERE id = ANY($1::int[]) AND status='baku'", [ids])
    if (rows.length !== ids.length) throw galat(400, 'Ada bahan yang tidak dikenal.')
    await transaksi(db, async (tx) => {
      for (const x of items)
        await tx.query(
          `INSERT INTO pantry_items (user_id, ingredient_id, jumlah, tempat) VALUES ($1,$2,$3,$4)
           ON CONFLICT (user_id, ingredient_id) DO UPDATE SET jumlah = pantry_items.jumlah + EXCLUDED.jumlah, tempat = EXCLUDED.tempat, diubah_pada = now()`,
          [req.user.id, x.ingredient_id, bulat(x.jumlah), tempat],
        )
    })
    res.status(201).json({ ditambahkan: items.length })
  })

  r.get('/mode', (_req, res) => res.json({ mock: modeMock() }))
  return r
}
