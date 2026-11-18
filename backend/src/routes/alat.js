import { Router } from 'express'

export function buatAlat(db) {
  const r = Router()

  // Semua alat + apakah pengguna punya (alat dasar dianggap ada kecuali dimatikan).
  r.get('/', async (req, res) => {
    const { rows } = await db.query(
      `SELECT t.id, t.nama, t.diasumsikan_ada, COALESCE(u.punya, t.diasumsikan_ada) AS punya
       FROM tools t LEFT JOIN user_tools u ON u.tool_id=t.id AND u.user_id=$1 ORDER BY t.id`,
      [req.user.id],
    )
    res.json(rows)
  })

  return r
}
