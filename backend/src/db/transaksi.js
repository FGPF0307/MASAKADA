// Menjalankan fn(tx) dalam satu transaksi; tx punya query(sql, params).
// PGlite punya transaction() bawaan; pg.Pool butuh satu koneksi khusus.
export async function transaksi(db, fn) {
  if (typeof db.transaction === 'function') return db.transaction(fn)
  const c = await db.connect()
  try {
    await c.query('BEGIN')
    const hasil = await fn(c)
    await c.query('COMMIT')
    return hasil
  } catch (e) {
    await c.query('ROLLBACK')
    throw e
  } finally {
    c.release()
  }
}
