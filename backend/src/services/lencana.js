// Lencana kontributor (spesifikasi 9.3). progres = angka sekarang, target dari tabel badges.
export async function hitungProgres(db, userId) {
  const { rows: [p] } = await db.query(
    `SELECT
       (SELECT count(*) FROM recipes WHERE penulis_id=$1 AND status='terbit')::int AS terbit,
       (SELECT count(*) FROM recipes r WHERE r.penulis_id=$1 AND r.status='terbit'
          AND EXISTS (SELECT 1 FROM recipe_tools rt JOIN tools t ON t.id=rt.tool_id WHERE rt.recipe_id=r.id AND t.nama='Rice cooker')
          AND NOT EXISTS (SELECT 1 FROM recipe_tools rt JOIN tools t ON t.id=rt.tool_id WHERE rt.recipe_id=r.id AND NOT t.diasumsikan_ada AND t.nama<>'Rice cooker'))::int AS rice,
       (SELECT count(*) FROM recipes r JOIN (SELECT recipe_id, avg(bintang) AS a, count(*) AS n FROM ratings GROUP BY recipe_id) x ON x.recipe_id=r.id
          WHERE r.penulis_id=$1 AND r.status='terbit' AND x.a >= 4.5 AND x.n >= 10)::int AS favorit,
       (SELECT count(*) FROM cook_history h JOIN recipes r ON r.id=h.recipe_id WHERE r.penulis_id=$1 AND h.user_id <> $1)::int AS dimasak,
       (SELECT count(*) FROM workshop_registrations WHERE user_id=$1 AND hadir)::int AS workshop`,
    [userId],
  )
  return {
    recipe_creator: p.terbit, prolific_cook: p.terbit, crowd_favorite: p.favorit,
    sering_dimasak: p.dimasak, rice_cooker_master: p.rice, workshop_graduate: p.workshop,
  }
}

// Memberi lencana yang syaratnya baru terpenuhi + notifikasi; mengembalikan nama lencana baru.
export async function cekLencana(tx, userId) {
  const progres = await hitungProgres(tx, userId)
  const { rows } = await tx.query(
    'SELECT b.id, b.kode, b.nama, b.target FROM badges b WHERE NOT EXISTS (SELECT 1 FROM user_badges u WHERE u.user_id=$1 AND u.badge_id=b.id)',
    [userId],
  )
  const baru = []
  for (const b of rows) {
    if ((progres[b.kode] ?? 0) < b.target) continue
    await tx.query('INSERT INTO user_badges (user_id, badge_id) VALUES ($1,$2)', [userId, b.id])
    await tx.query(
      "INSERT INTO notifications (user_id, jenis, judul, isi, tautan) VALUES ($1,'lencana_baru',$2,$3,'/pencapaian')",
      [userId, 'Lencana baru!', `Kamu mendapat lencana ${b.nama}.`],
    )
    baru.push(b.nama)
  }
  return baru
}
