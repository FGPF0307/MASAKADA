import { Router } from 'express'
import { transaksi } from '../db/transaksi.js'
import { galat } from '../middleware/error.js'
import { cekLencana } from '../services/lencana.js'
import { adalahPlus } from '../services/kuota.js'
import { levelDari } from '../services/level.js'
import { POIN, beri, poinMasak } from '../services/points.js'
import { bahanDulu, chipWaktu, hitungResep, statusBahan, urutkan } from '../services/matching.js'
import { urlFotoValid } from '../services/storage.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const WAKTU = ['kilat', 'cepat', 'sedang', 'lama']
const KESULITAN = ['mudah', 'sedang', 'sulit']
const URUT = ['bahan', 'tercepat', 'rating']

// "a,b" → ['a','b']; menolak nilai di luar daftar.
function daftar(nilai, boleh, nama) {
  if (!nilai) return []
  const a = String(nilai).split(',')
  if (a.some((x) => !boleh.includes(x))) throw galat(400, `Nilai "${nama}" tidak valid.`)
  return a
}

export function buatResep(db) {
  const r = Router()

  const porsiDari = async (req) => {
    if (req.query.porsi !== undefined) {
      const p = Number(req.query.porsi)
      if (!Number.isInteger(p) || p < 1 || p > 20) throw galat(400, 'Porsi harus 1–20.')
      return p
    }
    const { rows } = await db.query('SELECT porsi_default FROM profiles WHERE id=$1', [req.user.id])
    return rows[0]?.porsi_default ?? 1
  }
  // Label status untuk daftar cari/jelajahi: 'siap' atau jumlah bahan yang kurang.
  const beriLabel = (x) => ({ ...x, label: x.jumlah_kurang === 0 ? 'siap' : x.jumlah_kurang })
  const terbaikDulu = (a, b) => a.jumlah_kurang - b.jumlah_kurang || bahanDulu(a, b)

  // Beranda/Hasil: hanya resep yang siap dimasak, dan yang kurang tepat 1 bahan utama.
  r.get('/cocok', async (req, res) => {
    const q = req.query
    const waktu = daftar(q.waktu, WAKTU, 'waktu')
    const kesulitan = daftar(q.kesulitan, KESULITAN, 'kesulitan')
    const urut = q.urut ?? 'bahan'
    if (!URUT.includes(urut)) throw galat(400, 'Nilai "urut" tidak valid.')
    const porsi = await porsiDari(req)

    const { resep, jumlah_pantry } = await hitungResep(db, req.user.id, porsi)
    const lolos = resep.filter(
      (x) =>
        (q.alatLain === 'true' || !x.butuh_alat_lain) &&
        (!waktu.length || waktu.includes(x.chip_waktu)) &&
        (!kesulitan.length || kesulitan.includes(x.kesulitan)) &&
        (!q.alat || x.alat.includes(q.alat)),
    )
    res.json({
      siap: urutkan(lolos.filter((x) => x.jumlah_kurang === 0), urut),
      kurang1: urutkan(lolos.filter((x) => x.jumlah_kurang === 1), urut),
      jumlah_pantry,
      porsi,
    })
  })

  // Cari berdasarkan nama resep atau bahan (nama + sinonim).
  r.get('/cari', async (req, res) => {
    const q = String(req.query.q ?? '').trim().toLowerCase()
    const mode = req.query.mode ?? 'nama'
    if (!q) return res.json([])
    if (!['nama', 'bahan'].includes(mode)) throw galat(400, 'Mode pencarian tidak valid.')
    const { resep } = await hitungResep(db, req.user.id, await porsiDari(req))
    let cocok
    if (mode === 'nama') cocok = resep.filter((x) => x.judul.toLowerCase().includes(q))
    else {
      const { rows } = await db.query(
        `SELECT DISTINCT ri.recipe_id FROM recipe_ingredients ri JOIN ingredients i ON i.id = ri.ingredient_id
         WHERE lower(i.nama) LIKE '%'||$1||'%' OR EXISTS (SELECT 1 FROM unnest(i.sinonim) s WHERE lower(s) LIKE '%'||$1||'%')`,
        [q],
      )
      const ids = new Set(rows.map((x) => x.recipe_id))
      cocok = resep.filter((x) => ids.has(x.id))
    }
    res.json(cocok.sort(terbaikDulu).map(beriLabel))
  })

  // Semua resep tanpa melihat pantry (label tetap menunjukkan Siap / Kurang N).
  r.get('/jelajahi', async (req, res) => {
    const { resep } = await hitungResep(db, req.user.id, await porsiDari(req))
    const { kategori } = req.query
    res.json(resep.filter((x) => !kategori || x.kategori === kategori).sort(terbaikDulu).map(beriLabel))
  })

  // Detail resep + status tiap bahan untuk pengguna ini (tabel 5.3), takaran diskalakan ke ?porsi=.
  r.get('/:id', async (req, res, next) => {
    const { id } = req.params
    if (!UUID.test(id)) return next()
    const porsi = await porsiDari(req)
    const { rows: [rc] } = await db.query(
      `SELECT r.*, pr.nama AS penulis, pr.poin AS penulis_poin FROM recipes r JOIN profiles pr ON pr.id = r.penulis_id
       WHERE r.id = $1 AND r.status = 'terbit'`,
      [id],
    )
    if (!rc) throw galat(404, 'Resep tidak ditemukan.')

    const [bahan, alat, langkah, rating, dicoba, fav, plus] = await Promise.all([
      statusBahan(db, req.user.id, porsi, id),
      db.query(
        `SELECT t.nama, rt.catatan, COALESCE(u.punya, t.diasumsikan_ada) AS punya
         FROM recipe_tools rt JOIN tools t ON t.id = rt.tool_id LEFT JOIN user_tools u ON u.tool_id = t.id AND u.user_id = $2
         WHERE rt.recipe_id = $1 ORDER BY t.id`,
        [id, req.user.id],
      ),
      db.query('SELECT urutan, fase, foto_url, instruksi, timer_menit FROM recipe_steps WHERE recipe_id = $1 ORDER BY urutan', [id]),
      db.query('SELECT COALESCE(avg(bintang), 0)::float AS rata, count(*)::int AS n FROM ratings WHERE recipe_id = $1', [id]),
      db.query('SELECT count(DISTINCT user_id)::int AS n FROM cook_history WHERE recipe_id = $1', [id]),
      db.query('SELECT 1 FROM favorites WHERE user_id=$1 AND recipe_id=$2', [req.user.id, id]),
      adalahPlus(db, req.user.id),
    ])

    // Kalori dihitung dari tabel nutrisi (bukan AI), hanya untuk Plus; bahan opsional tidak dihitung.
    let nutrisi = null
    if (plus) {
      const { rows: k } = await db.query('SELECT id, kalori_per_100::float AS k FROM ingredients WHERE id = ANY($1::int[])', [bahan.map((b) => b.ingredient_id)])
      const per = new Map(k.map((x) => [x.id, x.k]))
      const kkal = bahan.filter((b) => b.peran !== 'opsional').reduce((s, b) => s + (b.butuh / 100) * (per.get(b.ingredient_id) ?? 0), 0)
      nutrisi = { kalori_total: Math.round(kkal), kalori_per_porsi: Math.round(kkal / porsi) }
    }
    const terkunci = rc.eksklusif && !plus // pratinjau saja: langkah disembunyikan
    const inti = bahan.filter((b) => b.peran !== 'opsional' && b.status !== 'pokok')
    const total = rc.menit_persiapan + rc.menit_memasak
    res.json({
      id: rc.id, judul: rc.judul, deskripsi: rc.deskripsi, foto_url: rc.foto_url, kategori: rc.kategori,
      penulis: rc.penulis, penulis_level: levelDari(rc.penulis_poin).nama,
      rating_rata: Math.round(rating.rows[0].rata * 10) / 10, jumlah_ulasan: rating.rows[0].n, dicoba_orang: dicoba.rows[0].n,
      menit_persiapan: rc.menit_persiapan, menit_memasak: rc.menit_memasak, total, chip_waktu: chipWaktu(total),
      kesulitan: rc.kesulitan, perlu_h_minus_1: rc.perlu_h_minus_1, eksklusif: rc.eksklusif,
      porsi_resep: rc.porsi, porsi_dipilih: porsi,
      alat: alat.rows,
      bahan: bahan.map(({ recipe_id, ...b }) => b), // eslint-disable-line no-unused-vars
      ringkasan: {
        bahan_kurang: inti.filter((b) => b.status === 'tidak_ada').map((b) => ({ id: b.ingredient_id, nama: b.nama, satuan: b.satuan, butuh: b.butuh })),
        ada_kurang_takaran: inti.some((b) => b.status === 'kurang_jumlah'),
      },
      langkah: terkunci ? [] : langkah.rows,
      favorit: fav.rows.length > 0, terkunci, nutrisi, plus,
    })
  })

  // ---- Memasak ----
  const ambilResep = async (id, userId) => {
    const { rows: [rc] } = await db.query(
      "SELECT r.id, r.judul, r.foto_url, r.porsi, r.penulis_id, r.eksklusif, p.nama AS penulis FROM recipes r JOIN profiles p ON p.id = r.penulis_id WHERE r.id=$1 AND r.status='terbit'",
      [id],
    )
    if (!rc) throw galat(404, 'Resep tidak ditemukan.')
    if (rc.eksklusif && !(await adalahPlus(db, userId))) throw galat(402, 'Resep eksklusif ini khusus anggota MasakAda Plus.')
    return rc
  }
  const bulanIni = async (tx, userId) =>
    (await tx.query("SELECT COALESCE(SUM(bahan_terpakai),0)::int AS n FROM cook_history WHERE user_id=$1 AND dimasak_pada >= date_trunc('month', now())", [userId])).rows[0].n
  const bulat = (n) => Math.round(n * 100) / 100

  // Mode memasak: langkah + bahan & alat per langkah (takaran diskalakan ke ?porsi=).
  r.get('/:id/masak', async (req, res, next) => {
    const { id } = req.params
    if (!UUID.test(id)) return next()
    const porsi = await porsiDari(req)
    const rc = await ambilResep(id, req.user.id)
    const [langkah, bahan, alat] = await Promise.all([
      db.query('SELECT id, urutan, fase, foto_url, instruksi, timer_menit FROM recipe_steps WHERE recipe_id=$1 ORDER BY urutan', [id]),
      db.query(
        `SELECT si.step_id, i.nama, i.satuan, (si.jumlah * $2::numeric / $3)::float AS butuh
         FROM step_ingredients si JOIN recipe_steps s ON s.id = si.step_id JOIN ingredients i ON i.id = si.ingredient_id
         WHERE s.recipe_id = $1 ORDER BY i.nama`,
        [id, porsi, rc.porsi],
      ),
      db.query('SELECT st.step_id, t.nama FROM step_tools st JOIN recipe_steps s ON s.id = st.step_id JOIN tools t ON t.id = st.tool_id WHERE s.recipe_id = $1 ORDER BY t.id', [id]),
    ])
    const bahanPer = Map.groupBy(bahan.rows, (x) => x.step_id)
    const alatPer = Map.groupBy(alat.rows, (x) => x.step_id)
    res.json({
      id: rc.id, judul: rc.judul, foto_url: rc.foto_url, porsi_dipilih: porsi,
      langkah: langkah.rows.map(({ id: stepId, ...l }) => ({
        ...l,
        bahan: (bahanPer.get(stepId) ?? []).map(({ nama, satuan, butuh }) => ({ nama, satuan, butuh: bulat(butuh) })),
        alat: (alatPer.get(stepId) ?? []).map((a) => a.nama),
      })),
    })
  })

  // Usulan pengurangan stok setelah memasak: bahan non-pokok yang ada di pantry. Opsional diusulkan 0.
  r.get('/:id/selesai-pratinjau', async (req, res, next) => {
    const { id } = req.params
    if (!UUID.test(id)) return next()
    const porsi = await porsiDari(req)
    const rc = await ambilResep(id, req.user.id)
    const bahan = await statusBahan(db, req.user.id, porsi, id)
    res.json({
      resep: { id: rc.id, judul: rc.judul, foto_url: rc.foto_url, penulis: rc.penulis },
      porsi,
      items: bahan
        .filter((b) => b.status !== 'pokok' && b.punya > 0)
        .map((b) => ({
          ingredient_id: b.ingredient_id, nama: b.nama, satuan: b.satuan, punya: b.punya,
          opsional: b.peran === 'opsional', usulan: b.peran === 'opsional' ? 0 : bulat(Math.min(b.butuh, b.punya)),
        })),
      bulan_ini: await bulanIni(db, req.user.id),
    })
  })

  // Selesai memasak (satu transaksi): stok dikurangi (tidak di bawah 0; jika 0 baris pantry dihapus),
  // riwayat dicatat. Bahan pokok tidak pernah dikurangi. Body {lewati:true} hanya mencatat riwayat.
  r.post('/:id/selesai', async (req, res, next) => {
    const { id } = req.params
    if (!UUID.test(id)) return next()
    const body = req.body ?? {}
    const porsi = body.porsi ?? (await porsiDari({ ...req, query: {} }))
    if (!Number.isInteger(porsi) || porsi < 1 || porsi > 20) throw galat(400, 'Porsi harus 1–20.')
    if (body.pakai_pengganti !== undefined && typeof body.pakai_pengganti !== 'boolean') throw galat(400, 'Nilai "pakai_pengganti" tidak valid.')
    const rc = await ambilResep(id, req.user.id)

    const mentah = body.lewati ? [] : (body.items ?? [])
    if (!Array.isArray(mentah) || mentah.some((x) => !Number.isInteger(x?.ingredient_id) || typeof x.jumlah_dipakai !== 'number' || !(x.jumlah_dipakai >= 0) || x.jumlah_dipakai > 100000))
      throw galat(400, 'Daftar bahan terpakai tidak valid.')
    const items = [...new Map(mentah.map((x) => [x.ingredient_id, x])).values()] // satu baris per bahan
    const { rows: milikResep } = await db.query('SELECT ingredient_id FROM recipe_ingredients WHERE recipe_id=$1', [id])
    const idResep = new Set(milikResep.map((x) => x.ingredient_id))
    if (items.some((x) => !idResep.has(x.ingredient_id))) throw galat(400, 'Ada bahan yang tidak termasuk dalam resep ini.')

    const hasil = await transaksi(db, async (tx) => {
      const { rows: [ch] } = await tx.query(
        'INSERT INTO cook_history (user_id, recipe_id, porsi, pakai_pengganti) VALUES ($1,$2,$3,$4) RETURNING id',
        [req.user.id, id, porsi, body.pakai_pengganti ?? false],
      )
      const sisaPantry = []
      for (const it of items) {
        if (it.jumlah_dipakai === 0) continue
        const { rows: [p] } = await tx.query(
          `SELECT p.id, p.jumlah::float AS jumlah, i.nama, i.satuan, (i.pokok_default OR s.user_id IS NOT NULL) AS pokok
           FROM pantry_items p JOIN ingredients i ON i.id = p.ingredient_id
           LEFT JOIN user_staples s ON s.ingredient_id = p.ingredient_id AND s.user_id = p.user_id
           WHERE p.user_id = $1 AND p.ingredient_id = $2`,
          [req.user.id, it.ingredient_id],
        )
        if (!p || p.pokok) continue
        const sisa = bulat(Math.max(0, p.jumlah - it.jumlah_dipakai))
        if (sisa === 0) await tx.query('DELETE FROM pantry_items WHERE id=$1', [p.id])
        else await tx.query('UPDATE pantry_items SET jumlah=$2, diubah_pada=now() WHERE id=$1', [p.id, sisa])
        await tx.query('INSERT INTO cook_history_items (cook_id, ingredient_id, jumlah_dipakai) VALUES ($1,$2,$3)', [ch.id, it.ingredient_id, bulat(Math.min(it.jumlah_dipakai, p.jumlah))])
        sisaPantry.push({ ingredient_id: it.ingredient_id, nama: p.nama, satuan: p.satuan, sisa })
      }
      await tx.query('UPDATE cook_history SET bahan_terpakai=$2 WHERE id=$1', [ch.id, sisaPantry.length])
      if (rc.penulis_id !== req.user.id) {
        await poinMasak(tx, rc.penulis_id, id, req.user.id)
        await cekLencana(tx, rc.penulis_id)
      }
      return { cook_id: ch.id, bahan_terpakai: sisaPantry.length, bahan_terpakai_bulan_ini: await bulanIni(tx, req.user.id), sisa_pantry: sisaPantry }
    })
    res.status(201).json({ ...hasil, boleh_menilai: rc.penulis_id !== req.user.id })
  })

  // ---- Ulasan: bintang (hanya yang sudah memasak) + komentar (semua pengguna) ----
  const resepTerbit = async (id) => {
    const { rows } = await db.query(
      "SELECT r.penulis_id, r.judul, p.nama AS penulis FROM recipes r JOIN profiles p ON p.id = r.penulis_id WHERE r.id=$1 AND r.status='terbit'",
      [id],
    )
    if (!rows.length) throw galat(404, 'Resep tidak ditemukan.')
    return rows[0]
  }
  const sudahMasak = async (userId, recipeId) =>
    (await db.query('SELECT 1 FROM cook_history WHERE user_id=$1 AND recipe_id=$2 LIMIT 1', [userId, recipeId])).rows.length > 0

  r.get('/:id/ulasan', async (req, res, next) => {
    const { id } = req.params
    if (!UUID.test(id)) return next()
    const rc = await resepTerbit(id)
    const batas = Math.min(Math.max(Number(req.query.batas) || 50, 1), 100)
    const [agg, dist, komentar, masak, saya] = await Promise.all([
      db.query('SELECT COALESCE(avg(bintang),0)::float AS rata, count(*)::int AS n FROM ratings WHERE recipe_id=$1', [id]),
      db.query('SELECT bintang, count(*)::int AS n FROM ratings WHERE recipe_id=$1 GROUP BY bintang', [id]),
      db.query(
        `SELECT c.id, p.nama, c.dibuat_pada, c.isi, c.foto_url, (c.user_id = $2) AS milik_saya, r.bintang, r.pakai_pengganti
         FROM comments c JOIN profiles p ON p.id = c.user_id
         LEFT JOIN ratings r ON r.recipe_id = c.recipe_id AND r.user_id = c.user_id
         WHERE c.recipe_id = $1 AND NOT c.disembunyikan ORDER BY c.dibuat_pada DESC LIMIT $3`,
        [id, req.user.id, batas],
      ),
      sudahMasak(req.user.id, id),
      db.query('SELECT bintang, pakai_pengganti FROM ratings WHERE recipe_id=$1 AND user_id=$2', [id, req.user.id]),
    ])
    res.json({
      judul: rc.judul,
      penulis: rc.penulis,
      rata: Math.round(agg.rows[0].rata * 10) / 10,
      jumlah: agg.rows[0].n,
      distribusi: Object.fromEntries([1, 2, 3, 4, 5].map((b) => [b, dist.rows.find((x) => x.bintang === b)?.n ?? 0])),
      boleh_menilai: masak && rc.penulis_id !== req.user.id,
      penilaian_saya: saya.rows[0] ?? null,
      ulasan: komentar.rows,
    })
  })

  // Memberi/ubah bintang: hanya setelah menyelesaikan mode memasak resep ini, dan bukan resep sendiri.
  r.put('/:id/rating', async (req, res, next) => {
    const { id } = req.params
    if (!UUID.test(id)) return next()
    const rc = await resepTerbit(id)
    const { bintang, pakai_pengganti = null } = req.body ?? {}
    if (!Number.isInteger(bintang) || bintang < 1 || bintang > 5) throw galat(400, 'Bintang harus 1–5.')
    if (pakai_pengganti !== null && typeof pakai_pengganti !== 'boolean') throw galat(400, 'Nilai "pakai_pengganti" tidak valid.')
    if (rc.penulis_id === req.user.id) throw galat(403, 'Kamu tidak bisa menilai resepmu sendiri.')
    if (!(await sudahMasak(req.user.id, id))) throw galat(403, 'Hanya orang yang sudah memasak resep ini yang bisa memberi bintang.')
    const hasil = await transaksi(db, async (tx) => {
      const { rows: [sebelum] } = await tx.query('SELECT bintang FROM ratings WHERE recipe_id=$1 AND user_id=$2', [id, req.user.id])
      const { rows } = await tx.query(
        `INSERT INTO ratings (recipe_id, user_id, bintang, pakai_pengganti) VALUES ($1,$2,$3,$4)
         ON CONFLICT (recipe_id, user_id) DO UPDATE SET bintang = EXCLUDED.bintang, pakai_pengganti = EXCLUDED.pakai_pengganti
         RETURNING bintang, pakai_pengganti`,
        [id, req.user.id, bintang, pakai_pengganti],
      )
      // +3 untuk penulis saat rating naik menjadi 4–5 bintang (tidak diberikan dua kali untuk orang yang sama).
      if (bintang >= 4 && !(sebelum?.bintang >= 4)) await beri(tx, rc.penulis_id, id, 'rating_tinggi', POIN.rating)
      await cekLencana(tx, rc.penulis_id)
      return rows[0]
    })
    res.json(hasil)
  })

  // Komentar terbuka untuk semua pengguna (maks 5 per menit untuk mencegah spam).
  r.post('/:id/komentar', async (req, res, next) => {
    const { id } = req.params
    if (!UUID.test(id)) return next()
    await resepTerbit(id)
    const { isi, foto_url = null } = req.body ?? {}
    const teks = typeof isi === 'string' ? isi.trim() : ''
    if (!teks || teks.length > 1000) throw galat(400, 'Komentar harus 1–1000 karakter.')
    if (foto_url !== null && !urlFotoValid(foto_url)) throw galat(400, 'Foto tidak valid.')
    const { rows: [{ n }] } = await db.query("SELECT count(*)::int AS n FROM comments WHERE user_id=$1 AND dibuat_pada > now() - interval '1 minute'", [req.user.id])
    if (n >= 5) throw galat(429, 'Terlalu banyak komentar. Tunggu sebentar.')
    const { rows } = await db.query('INSERT INTO comments (recipe_id, user_id, isi, foto_url) VALUES ($1,$2,$3,$4) RETURNING id', [id, req.user.id, teks, foto_url])
    res.status(201).json({ id: rows[0].id })
  })

  return r
}
