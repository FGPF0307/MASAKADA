import { supabase } from '../lib/supabaseClient'
import { t } from '../copy/id'

const BASE = import.meta.env.VITE_API_URL ?? ''

// Galat server ({ pesan }) dilempar sebagai Error dengan .status; gagal terhubung memberi status 0.
const galatDari = (res, json) => Object.assign(new Error(json.pesan ?? t.galat.umum), { status: res.status })
const kirim = (url, opsi) =>
  fetch(url, opsi).catch(() => {
    throw Object.assign(new Error('Tidak bisa terhubung ke server. Periksa koneksimu.'), { status: 0 })
  })

// Pembungkus fetch: menambahkan token login.
export async function api(path, { body, ...opsi } = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await kirim(`${BASE}/api${path}`, {
    ...opsi,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}`, ...opsi.headers },
    body: body && JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw galatDari(res, json)
  return json
}

// Mengirim Blob mentah (foto hasil kompresi) ke server; mengembalikan JSON respons.
export async function kirimBlob(path, blob) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await kirim(`${BASE}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': blob.type, Authorization: `Bearer ${session?.access_token}` },
    body: blob,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw galatDari(res, json)
  return json
}

// Mengunggah foto ke server; mengembalikan URL foto.
export const unggahFotoKeServer = async (blob) => (await kirimBlob('/unggah-foto', blob)).url
