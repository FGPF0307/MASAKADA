import * as d from './data.js'

// Id tetap supaya Sinta (penulis resep demo) selalu sama. Akun asli dibuat lewat Supabase Auth.
export const SINTA_ID = '00000000-0000-4000-8000-000000000001'
const PERAN = { u: 'utama', o: 'opsional', b: 'bumbu_dasar' }
const FASE = { p: 'persiapan', m: 'memasak' }

// db: objek dengan query(sql, params) → { rows } (pg.Pool atau PGlite). Aman dijalankan ulang.
export async function seed(db) {
  const { rows: [{ n }] } = await db.query('SELECT count(*)::int AS n FROM ingredients')
  if (n > 0) return false

  for (const [nama, dasar] of d.alat) await db.query('INSERT INTO tools (nama, diasumsikan_ada) VALUES ($1,$2)', [nama, dasar])
  for (const [kode, nama, desk, target] of d.lencana)
    await db.query('INSERT INTO badges (kode, nama, deskripsi, target) VALUES ($1,$2,$3,$4)', [kode, nama, desk, target])
  for (const [nama, ket] of d.mitra) await db.query('INSERT INTO partner_stores (nama, keterangan) VALUES ($1,$2)', [nama, ket])

  for (const baris of d.bahan) {
    const [nama, sin, kat, sat, flag = ''] = baris.split('|')
    await db.query(
      'INSERT INTO ingredients (nama, sinonim, kategori, satuan, bisa_pokok, pokok_default) VALUES ($1,$2,$3,$4,$5,$6)',
      [nama, sin ? sin.split(',') : [], kat, sat, flag !== '', flag === 'd'],
    )
  }
  const idBahan = Object.fromEntries((await db.query('SELECT id, nama FROM ingredients')).rows.map((r) => [r.nama, r.id]))
  const idAlat = Object.fromEntries((await db.query('SELECT id, nama FROM tools')).rows.map((r) => [r.nama, r.id]))
  const bahanId = (nama) => idBahan[nama] ?? Promise.reject(new Error(`Bahan tidak ada di daftar baku: ${nama}`))

  await db.query("INSERT INTO profiles (id, nama, poin, setup_selesai) VALUES ($1,'Sinta',145,true)", [SINTA_ID])

  for (const r of d.resep) {
    const { rows: [{ id }] } = await db.query(
      `INSERT INTO recipes (penulis_id, judul, deskripsi, kategori, menit_persiapan, menit_memasak, kesulitan, eksklusif, status, terbit_pada)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'terbit',now()) RETURNING id`,
      [SINTA_ID, r.judul, r.deskripsi ?? null, r.kategori, r.persiapan, r.memasak, r.kesulitan, !!r.eksklusif],
    )
    for (const [nama, catatan] of r.alat ?? [])
      await db.query('INSERT INTO recipe_tools VALUES ($1,$2,$3)', [id, idAlat[nama], catatan])
    for (const [nama, jumlah, peran] of r.bahan)
      await db.query('INSERT INTO recipe_ingredients VALUES ($1,$2,$3,$4)', [id, await bahanId(nama), jumlah, PERAN[peran]])

    for (const [i, [fase, teks, timer]] of r.langkah.entries()) {
      const { rows: [{ id: stepId }] } = await db.query(
        'INSERT INTO recipe_steps (recipe_id, urutan, fase, instruksi, timer_menit) VALUES ($1,$2,$3,$4,$5) RETURNING id',
        [id, i + 1, FASE[fase], teks, timer ?? null],
      )
      for (const [nama, jumlah] of r.bahan)
        if (new RegExp(`\\b${nama}\\b`, 'i').test(teks))
          await db.query('INSERT INTO step_ingredients VALUES ($1,$2,$3)', [stepId, idBahan[nama], jumlah])
      for (const [nama] of r.alat ?? [])
        if (new RegExp(`\\b${nama}\\b`, 'i').test(teks))
          await db.query('INSERT INTO step_tools VALUES ($1,$2)', [stepId, idAlat[nama]])
    }
  }

  for (const [judul, tema, pengisi, harga, kursi, hari, bahan] of d.workshop) {
    const { rows: [{ id }] } = await db.query(
      `INSERT INTO workshops (judul, tema, pengisi, harga, kursi, mulai) VALUES ($1,$2,$3,$4,$5, now() + ($6 || ' days')::interval) RETURNING id`,
      [judul, tema, pengisi, harga, kursi, String(hari)],
    )
    for (const [nama, jumlah] of bahan) await db.query('INSERT INTO workshop_ingredients VALUES ($1,$2,$3)', [id, await bahanId(nama), jumlah])
  }
  return true
}
