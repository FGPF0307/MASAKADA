import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { Tombol } from '../components/Form'
import { t } from '../copy/id'

export const KUNCI_ONBOARDING = 'masakada_onboarding_selesai'

export default function Onboarding() {
  const [i, setI] = useState(0)
  const go = useNavigate()
  const slide = t.onboarding.slide[i]
  const terakhir = i === t.onboarding.slide.length - 1

  const selesai = (tujuan) => {
    try { localStorage.setItem(KUNCI_ONBOARDING, '1') } catch { /* mode privat: abaikan */ }
    go(tujuan)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-6 py-8 max-w-md mx-auto">
      <div className="w-full flex items-center justify-between">
        <Logo />
        <button className="text-sm text-neutral-500" onClick={() => selesai('/')}>{t.onboarding.lewati}</button>
      </div>

      <div className="text-center space-y-4">
        <div className="mx-auto size-40 rounded-full bg-siap flex items-center justify-center font-judul text-6xl text-sage-gelap">{i + 1}</div>
        <h1 className="font-judul text-3xl font-bold">{slide.judul}</h1>
        <p className="text-neutral-600">{slide.isi}</p>
      </div>

      <div className="w-full space-y-3">
        <div className="flex justify-center gap-2" aria-hidden>
          {t.onboarding.slide.map((_, n) => (
            <span key={n} className={`h-2 rounded-full ${n === i ? 'w-6 bg-sage-gelap' : 'w-2 bg-teks/15'}`} />
          ))}
        </div>
        {terakhir ? (
          <>
            <Tombol onClick={() => selesai('/daftar')}>{t.onboarding.mulai}</Tombol>
            <Link to="/masuk" onClick={() => selesai('/masuk')} className="block text-center text-sm text-sage-gelap">{t.onboarding.sudahPunyaAkun}</Link>
            <button type="button" onClick={() => selesai('/')} className="block w-full text-center text-sm text-neutral-500 underline">{t.tamu.lihatLihat}</button>
          </>
        ) : (
          <Tombol onClick={() => setI(i + 1)}>{t.onboarding.lanjut}</Tombol>
        )}
      </div>
    </div>
  )
}
