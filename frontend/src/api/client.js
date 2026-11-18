import { supabase } from '../lib/supabaseClient'
import { t } from '../copy/id'

const BASE = import.meta.env.VITE_API_URL ?? ''

// Pembungkus fetch: menambahkan token login; galat server ({ pesan }) dilempar sebagai Error.
export async function api(path, { body, ...opsi } = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${BASE}/api${path}`, {
    ...opsi,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}`, ...opsi.headers },
    body: body && JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.pesan ?? t.galat.umum)
  return json
}
