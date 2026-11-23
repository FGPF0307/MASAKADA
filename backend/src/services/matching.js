// Logika matching (spesifikasi bagian 5). Dibaca-saja: tidak menulis ke database.

export const chipWaktu = (total) => (total <= 15 ? 'kilat' : total <= 30 ? 'cepat' : total <= 60 ? 'sedang' : 'lama')

// Status satu bahan resep untuk pengguna (tabel 5.3).
export function tentukanStatus({ pokok, butuh, punya, peran }) {
  if (pokok) return 'pokok'
  if (punya >= butuh) return 'ada'
  if (punya > 0) return 'kurang_jumlah'
  return peran === 'opsional' ? 'opsional' : 'tidak_ada'
}

// Status tiap bahan resep. Kebutuhan ikut skala porsi: jumlah × porsi / porsi_resep.
// recipeId: batasi ke satu resep (dipakai halaman detail).
export async function statusBahan(db, userId, porsi, recipeId = null) {
  const { rows } = await db.query(
    `SELECT ri.recipe_id, ri.ingredient_id, i.nama, i.satuan, ri.peran,
            (ri.jumlah * $2::numeric / r.porsi)::float AS butuh,
            (i.pokok_default OR s.user_id IS NOT NULL) AS pokok,
            COALESCE(p.jumlah, 0)::float AS punya
     FROM recipe_ingredients ri
     JOIN recipes r ON r.id = ri.recipe_id AND r.status = 'terbit'
     JOIN ingredients i ON i.id = ri.ingredient_id
     LEFT JOIN user_staples s ON s.ingredient_id = ri.ingredient_id AND s.user_id = $1
     LEFT JOIN pantry_items p ON p.ingredient_id = ri.ingredient_id AND p.user_id = $1
     WHERE ($3::uuid IS NULL OR r.id = $3)
     ORDER BY ri.peran, i.nama`,
    [userId, porsi, recipeId],
  )
  return rows.map((x) => ({ ...x, status: tentukanStatus(x) }))
}

// Kategori resep yang tidak butuh pemanas sama sekali.
export const TANPA_MASAK = 'Tanpa masak'

// Semua resep terbit + hasil hitung untuk pengguna ini.
export async function hitungResep(db, userId, porsi) {
  const [resep, alat, status, kompor, pantry] = await Promise.all([
    db.query(
      `SELECT r.id, r.judul, r.foto_url, r.kategori, r.porsi, r.menit_persiapan, r.menit_memasak, r.kesulitan,
              r.eksklusif, r.perlu_h_minus_1, r.terbit_pada, pr.nama AS penulis,
              COALESCE(rt.rata, 0)::float AS rata, COALESCE(rt.n, 0)::int AS n
       FROM recipes r JOIN profiles pr ON pr.id = r.penulis_id
       LEFT JOIN (SELECT recipe_id, avg(bintang) AS rata, count(*) AS n FROM ratings GROUP BY recipe_id) rt ON rt.recipe_id = r.id
       WHERE r.status = 'terbit'`,
    ),
    db.query(
      `SELECT rt.recipe_id, t.nama, t.diasumsikan_ada, rt.catatan, COALESCE(u.punya, t.diasumsikan_ada) AS punya
       FROM recipe_tools rt JOIN tools t ON t.id = rt.tool_id
       LEFT JOIN user_tools u ON u.tool_id = t.id AND u.user_id = $1`,
      [userId],
    ),
    statusBahan(db, userId, porsi),
    db.query(`SELECT COALESCE(u.punya, true) AS punya FROM tools t LEFT JOIN user_tools u ON u.tool_id = t.id AND u.user_id = $1 WHERE t.nama = 'Kompor'`, [userId]),
    db.query('SELECT count(*)::int AS n FROM pantry_items WHERE user_id = $1 AND jumlah > 0', [userId]),
  ])
  const punyaKompor = kompor.rows[0]?.punya ?? true
  const per = (rows) => Map.groupBy(rows, (x) => x.recipe_id)
  const alatPer = per(alat.rows)
  const statusPer = per(status)

  const hasil = resep.rows.map((r) => {
    const bahan = statusPer.get(r.id) ?? []
    const inti = bahan.filter((b) => b.peran !== 'opsional' && b.status !== 'pokok')
    const kurang = inti.filter((b) => b.status === 'tidak_ada')
    const daftarAlat = alatPer.get(r.id) ?? []
    // Alat lain boleh diganti bila resep mencatat alternatif ("panci juga bisa").
    // Tanpa kompor: resep harus memakai alat pemanas lain yang dimiliki, atau memang tanpa dimasak.
    let alatOk = daftarAlat.every((a) => a.punya || a.catatan)
    if (!punyaKompor && r.kategori !== TANPA_MASAK) alatOk &&= daftarAlat.some((a) => a.punya && !a.diasumsikan_ada)
    const total = r.menit_persiapan + r.menit_memasak
    return {
      id: r.id, judul: r.judul, foto_url: r.foto_url, kategori: r.kategori, porsi: r.porsi, penulis: r.penulis,
      menit_persiapan: r.menit_persiapan, menit_memasak: r.menit_memasak, total, chip_waktu: chipWaktu(total),
      kesulitan: r.kesulitan, eksklusif: r.eksklusif, perlu_h_minus_1: r.perlu_h_minus_1, terbit_pada: r.terbit_pada,
      rating_rata: Math.round(r.rata * 10) / 10, jumlah_ulasan: r.n,
      jumlah_kurang: kurang.length,
      jumlah_kurang_takaran: inti.filter((b) => b.status === 'kurang_jumlah').length,
      bahan_pantry_terpakai: inti.filter((b) => b.status === 'ada' || b.status === 'kurang_jumlah').length,
      bahan_kurang: kurang.map((b) => ({ id: b.ingredient_id, nama: b.nama })),
      alat: daftarAlat.map((a) => a.nama), butuh_alat_lain: !alatOk,
    }
  })
  return { resep: hasil, jumlah_pantry: pantry.rows[0].n }
}

// Urutan 5.4: paling banyak pakai bahan → kurang takaran tersedikit → rating → terbaru.
export const bahanDulu = (a, b) =>
  b.bahan_pantry_terpakai - a.bahan_pantry_terpakai ||
  a.jumlah_kurang_takaran - b.jumlah_kurang_takaran ||
  b.rating_rata - a.rating_rata ||
  new Date(b.terbit_pada) - new Date(a.terbit_pada)

export function urutkan(daftar, urut = 'bahan') {
  const pembanding = {
    bahan: bahanDulu,
    tercepat: (a, b) => a.total - b.total || bahanDulu(a, b),
    rating: (a, b) => b.rating_rata - a.rating_rata || b.jumlah_ulasan - a.jumlah_ulasan || bahanDulu(a, b),
  }[urut]
  return [...daftar].sort(pembanding)
}
