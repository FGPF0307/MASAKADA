export const galat = (status, pesan) => Object.assign(new Error(pesan), { status })

export const notFound = (_req, _res, next) => next(galat(404, 'Rute tidak ditemukan.'))

// Format galat: { pesan } dalam Bahasa Indonesia.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  const status = err.status ?? 500
  if (status === 500) console.error(err)
  res.status(status).json({ pesan: status === 500 ? 'Ups, ada yang salah di server. Coba lagi sebentar.' : err.message })
}
