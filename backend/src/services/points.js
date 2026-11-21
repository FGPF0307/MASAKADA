// Poin kontributor (spesifikasi bagian 9). Semua fungsi menerima tx/db dengan query(sql, params) dan dipanggil
// dalam transaksi yang sama dengan aksinya.
export const POIN = { terbit: 30, dimasak: 5, rating: 3, batasDimasakBulanan: 50 }

// Memberi poin ke kontributor; pelanggan Plus mendapat bonus 10% (dibulatkan ke bawah) sebagai baris terpisah.
export async function beri(tx, userId, recipeId, aksi, poin) {
  if (poin <= 0) return 0
  await tx.query('INSERT INTO points_log (user_id, recipe_id, aksi, poin) VALUES ($1,$2,$3,$4)', [userId, recipeId, aksi, poin])
  let total = poin
  const { rows: [u] } = await tx.query('SELECT paket FROM profiles WHERE id=$1', [userId])
  const bonus = u?.paket === 'plus' ? Math.floor(poin * 0.1) : 0
  if (bonus > 0) {
    await tx.query("INSERT INTO points_log (user_id, recipe_id, aksi, poin) VALUES ($1,$2,'bonus_plus',$3)", [userId, recipeId, bonus])
    total += bonus
  }
  await tx.query('UPDATE profiles SET poin = poin + $2 WHERE id=$1', [userId, total])
  return total
}

// +5 untuk penulis saat orang lain menyelesaikan memasak resepnya: sekali per orang per resep per bulan,
// maksimal 50 per resep per bulan (saat tercapai, dicatat satu baris 0 "batas_bulanan"). Panggil SETELAH cook_history dicatat.
export async function poinMasak(tx, penulisId, recipeId, pemasakId) {
  const { rows: [{ n }] } = await tx.query(
    "SELECT count(*)::int AS n FROM cook_history WHERE user_id=$1 AND recipe_id=$2 AND dimasak_pada >= date_trunc('month', now())",
    [pemasakId, recipeId],
  )
  if (n !== 1) return 0
  const { rows: [{ jumlah }] } = await tx.query(
    "SELECT COALESCE(sum(poin),0)::int AS jumlah FROM points_log WHERE user_id=$1 AND recipe_id=$2 AND aksi='dimasak_orang' AND dibuat_pada >= date_trunc('month', now())",
    [penulisId, recipeId],
  )
  if (jumlah >= POIN.batasDimasakBulanan) {
    const { rows } = await tx.query(
      "SELECT 1 FROM points_log WHERE user_id=$1 AND recipe_id=$2 AND aksi='batas_bulanan' AND dibuat_pada >= date_trunc('month', now())",
      [penulisId, recipeId],
    )
    if (!rows.length) await tx.query("INSERT INTO points_log (user_id, recipe_id, aksi, poin) VALUES ($1,$2,'batas_bulanan',0)", [penulisId, recipeId])
    return 0
  }
  return beri(tx, penulisId, recipeId, 'dimasak_orang', POIN.dimasak)
}

// Resep diturunkan: semua poin dari resep itu dicabut (entri negatif; poin tidak di bawah 0). Aman dipanggil berulang.
export async function cabut(tx, penulisId, recipeId) {
  const { rows: [{ jumlah }] } = await tx.query('SELECT COALESCE(sum(poin),0)::int AS jumlah FROM points_log WHERE user_id=$1 AND recipe_id=$2', [penulisId, recipeId])
  if (jumlah <= 0) return 0
  await tx.query("INSERT INTO points_log (user_id, recipe_id, aksi, poin) VALUES ($1,$2,'resep_dihapus',$3)", [penulisId, recipeId, -jumlah])
  await tx.query('UPDATE profiles SET poin = GREATEST(0, poin - $2) WHERE id=$1', [penulisId, jumlah])
  return jumlah
}
