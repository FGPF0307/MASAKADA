import { galat } from '../middleware/error.js'

// Paket & kuota (spesifikasi bagian 6.2 dan 10). Kuota dihitung dari ai_usage_log di server, sebelum memanggil AI.
// Reset mingguan: Senin 00:00 WIB. Reset bulanan: tanggal 1 pukul 00:00 WIB.
export const KUOTA = {
  chat: { gratis: 3, plus: 30, per: 'minggu' },
  substitusi: { gratis: 0, plus: 5, per: 'bulan' },
  scan: { gratis: 0, plus: 30, per: 'bulan' },
  rencana: { gratis: 0, plus: 3, per: 'minggu' }, // 1 rencana + 2 buat ulang
}
const WIB = 7 * 3600e3

export function awalPeriode(per, sekarang = new Date()) {
  const w = new Date(sekarang.getTime() + WIB)
  const hari = per === 'bulan' ? 1 : w.getUTCDate() - ((w.getUTCDay() + 6) % 7)
  return new Date(Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), hari) - WIB)
}

// Percobaan/langganan yang sudah lewat otomatis kembali ke Gratis.
export async function adalahPlus(db, userId) {
  await db.query("UPDATE profiles SET paket='gratis' WHERE id=$1 AND paket='plus' AND plus_sampai < now()", [userId])
  const { rows } = await db.query('SELECT paket FROM profiles WHERE id=$1', [userId])
  return rows[0]?.paket === 'plus'
}

export const wajibPlus = async (db, userId) => {
  if (!(await adalahPlus(db, userId))) throw galat(402, 'Fitur ini khusus anggota MasakAda Plus.')
}

export async function sisaKuota(db, userId, fitur) {
  const k = KUOTA[fitur]
  const plus = await adalahPlus(db, userId)
  const batas = plus ? k.plus : k.gratis
  const { rows: [{ n }] } = await db.query('SELECT count(*)::int AS n FROM ai_usage_log WHERE user_id=$1 AND fitur=$2 AND dibuat_pada >= $3', [userId, fitur, awalPeriode(k.per)])
  return { batas, terpakai: n, sisa: Math.max(0, batas - n), per: k.per, plus }
}

// Menolak jika kuota habis; jika masih ada, mencatat satu pemakaian dan mengembalikan kuota terbaru.
export async function pakaiKuota(db, userId, fitur) {
  const q = await sisaKuota(db, userId, fitur)
  if (q.batas === 0) throw galat(402, 'Fitur ini khusus anggota MasakAda Plus.')
  if (q.sisa <= 0) throw galat(429, `Kuota ${fitur === 'chat' ? 'Chef AI' : fitur} ${q.per} ini sudah habis.`)
  await db.query('INSERT INTO ai_usage_log (user_id, fitur) VALUES ($1,$2)', [userId, fitur])
  return { ...q, terpakai: q.terpakai + 1, sisa: q.sisa - 1 }
}
