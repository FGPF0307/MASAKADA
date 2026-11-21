import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { Pesan } from '../components/Form'
import TombolKembali from '../components/TombolKembali'
import { t } from '../copy/id'

export const KUNCI_DRAF = 'masakada_draf_id'
const bacaId = () => { try { return localStorage.getItem(KUNCI_DRAF) } catch { return null } }
export const simpanId = (id) => { try { id ? localStorage.setItem(KUNCI_DRAF, id) : localStorage.removeItem(KUNCI_DRAF) } catch { /* mode privat */ } }

const LANGKAH = ['info', 'bahan', 'langkah']
const BAGIAN = ['info', 'bahan', 'langkah', 'pratinjau']

// Pembungkus wizard "Bagikan resep": memuat/membuat draf dan menyimpannya otomatis (jeda 800 ms).
// Halaman anak memakai useOutletContext(): { draf, ubah, simpanSekarang, status }.
export default function Bagikan() {
  const [sp, setSp] = useSearchParams()
  const { pathname } = useLocation()
  const go = useNavigate()
  const [draf, setDraf] = useState(null)
  const [status, setStatus] = useState('tersimpan') // tersimpan | menyimpan | gagal
  const [galat, setGalat] = useState('')
  const tunggu = useRef({}) // perubahan yang belum terkirim
  const jeda = useRef(null)
  const id = useRef(null)
  const b = t.bagikan

  // ?d=<id> membuka draf tertentu (dari Resep saya); tanpa itu, pakai draf terakhir atau buat baru.
  useEffect(() => {
    let batal = false
    ;(async () => {
      try {
        const dariUrl = sp.get('d')
        let kandidat = dariUrl ?? bacaId()
        let data = null
        if (kandidat) data = await api(`/resep-saya/${kandidat}`).catch(() => null)
        if (!data) {
          kandidat = (await api('/resep', { method: 'POST' })).id
          data = await api(`/resep-saya/${kandidat}`)
        }
        if (batal) return
        if (!['draf', 'ditolak'].includes(data.status)) { simpanId(null); return go(`/resep-saya/${data.id}`, { replace: true }) }
        id.current = data.id
        simpanId(data.id)
        if (dariUrl) setSp({}, { replace: true })
        setDraf(data)
      } catch (e) {
        if (!batal) setGalat(e.message)
      }
    })()
    return () => { batal = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const kirimPerubahan = useCallback(async () => {
    clearTimeout(jeda.current)
    const patch = tunggu.current
    if (!Object.keys(patch).length) return true
    tunggu.current = {}
    setStatus('menyimpan')
    try {
      await api(`/resep/${id.current}`, { method: 'PATCH', body: patch })
      if (!Object.keys(tunggu.current).length) setStatus('tersimpan')
      return true
    } catch (e) {
      tunggu.current = { ...patch, ...tunggu.current } // coba lagi nanti
      setStatus('gagal')
      setGalat(e.message)
      return false
    }
  }, [])

  const ubah = useCallback((patch) => {
    setDraf((d) => ({ ...d, ...patch }))
    tunggu.current = { ...tunggu.current, ...patch }
    setStatus('menyimpan')
    clearTimeout(jeda.current)
    jeda.current = setTimeout(kirimPerubahan, 800)
  }, [kirimPerubahan])

  // Simpan sisa perubahan saat meninggalkan wizard.
  useEffect(() => () => { kirimPerubahan() }, [kirimPerubahan])

  if (galat && !draf) return <div className="max-w-md space-y-3"><TombolKembali ke="/" /><Pesan>{galat}</Pesan></div>
  if (!draf) return <p className="text-neutral-500">{t.halaman.memuat}</p>

  const bagian = BAGIAN.find((x) => pathname.endsWith(`/${x}`))
  if (!bagian) return <Navigate to="/bagikan/info" replace />
  const n = LANGKAH.indexOf(bagian) + 1

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <TombolKembali ke={bagian === 'info' ? '/' : `/bagikan/${BAGIAN[BAGIAN.indexOf(bagian) - 1]}`} />
          <div className="min-w-0 flex-1">
            <h1 className="font-judul text-2xl font-bold">{b.judul}</h1>
            <p className="text-sm text-neutral-500">{n ? b.langkah(n, b.nama[n - 1]) : b.pratinjau}</p>
          </div>
          <span role="status" className={`shrink-0 rounded-full px-3 py-1 text-xs ${status === 'gagal' ? 'bg-kurang text-terakota' : 'bg-siap text-sage-gelap'}`}>
            {status === 'tersimpan' ? b.tersimpan : status === 'menyimpan' ? b.menyimpan : b.gagalSimpan}
          </span>
        </div>
        {n > 0 && (
          <div className="flex gap-1.5" aria-hidden>
            {LANGKAH.map((x, i) => <span key={x} className={`h-1.5 flex-1 rounded-full ${i < n ? 'bg-sage-gelap' : 'bg-black/10'}`} />)}
          </div>
        )}
      </header>
      {status === 'gagal' && <Pesan>{galat}</Pesan>}
      <Outlet context={{ draf, ubah, simpanSekarang: kirimPerubahan, status }} />
    </div>
  )
}
