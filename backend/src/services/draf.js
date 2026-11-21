// Membaca satu resep lengkap dalam bentuk yang bisa disunting (info, alat, bahan, langkah) — dipakai penulis dan admin.
export async function muatDraf(db, id) {
  const { rows: [r] } = await db.query(
    `SELECT r.id, r.penulis_id, p.nama AS penulis, r.judul, r.deskripsi, r.foto_url, r.kategori, r.porsi,
            r.menit_persiapan, r.menit_memasak, r.kesulitan, r.perlu_h_minus_1, r.status, r.catatan_penolakan,
            r.diubah_pada, r.ditinjau_pada, r.terbit_pada
     FROM recipes r JOIN profiles p ON p.id = r.penulis_id WHERE r.id = $1`,
    [id],
  )
  if (!r) return null
  const [alat, bahan, langkah, stepBahan, stepAlat] = await Promise.all([
    db.query('SELECT tool_id FROM recipe_tools WHERE recipe_id=$1 ORDER BY tool_id', [id]),
    db.query(
      `SELECT ri.ingredient_id, i.nama, i.satuan, ri.jumlah::float AS jumlah, ri.peran, (i.status <> 'baku') AS belum_baku
       FROM recipe_ingredients ri JOIN ingredients i ON i.id = ri.ingredient_id WHERE ri.recipe_id=$1 ORDER BY i.nama`,
      [id],
    ),
    db.query('SELECT id, urutan, fase, foto_url, instruksi, timer_menit FROM recipe_steps WHERE recipe_id=$1 ORDER BY urutan', [id]),
    db.query('SELECT si.step_id, si.ingredient_id FROM step_ingredients si JOIN recipe_steps s ON s.id = si.step_id WHERE s.recipe_id=$1', [id]),
    db.query('SELECT st.step_id, st.tool_id FROM step_tools st JOIN recipe_steps s ON s.id = st.step_id WHERE s.recipe_id=$1', [id]),
  ])
  const sb = Map.groupBy(stepBahan.rows, (x) => x.step_id)
  const sa = Map.groupBy(stepAlat.rows, (x) => x.step_id)
  return {
    ...r,
    alat: alat.rows.map((x) => x.tool_id),
    bahan: bahan.rows,
    langkah: langkah.rows.map(({ id: stepId, ...l }) => ({
      ...l,
      bahan: (sb.get(stepId) ?? []).map((x) => x.ingredient_id),
      alat: (sa.get(stepId) ?? []).map((x) => x.tool_id),
    })),
  }
}
