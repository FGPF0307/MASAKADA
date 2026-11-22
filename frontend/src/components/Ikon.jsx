// Ikon garis seragam (stroke 1.8, ujung bulat) untuk kartu resep dan Beranda.
const Dasar = ({ className = 'size-5', children, ...p }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
    {children}
  </svg>
)

export const IkonJam = (p) => <Dasar {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Dasar>
export const IkonBintang = (p) => <Dasar fill="currentColor" strokeWidth="1" {...p}><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></Dasar>
export const IkonCari = (p) => <Dasar {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Dasar>
export const IkonPetir = (p) => <Dasar {...p}><path d="M13 3L5 14h6l-1 7 8-11h-6z" /></Dasar>
export const IkonPanci = (p) => <Dasar {...p}><path d="M4 11h16v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" /><path d="M2 11h2M20 11h2M8 7c0-2 2-2 2-4M14 7c0-2 2-2 2-4" /></Dasar>
export const IkonTunas = (p) => <Dasar {...p}><path d="M12 21v-9" /><path d="M12 13c0-4-3-6-7-6 0 4 3 6 7 6z" /><path d="M12 16c0-3 2-5 6-5 0 3-2 5-6 5z" /></Dasar>
export const IkonHati = ({ terisi, ...p }) => <Dasar fill={terisi ? 'currentColor' : 'none'} {...p}><path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z" /></Dasar>
export const IkonBagikan = (p) => <Dasar {...p}><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.9l7.6-4.3M8.2 13.1l7.6 4.3" /></Dasar>
export const IkonKamera = (p) => <Dasar {...p}><path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13" r="3.5" /></Dasar>
export const IkonChevron = (p) => <Dasar {...p}><path d="M9 5l7 7-7 7" /></Dasar>
export const IkonCentang = (p) => <Dasar strokeWidth="2.4" {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Dasar>
export const IkonTutup = (p) => <Dasar strokeWidth="2.2" {...p}><path d="M6 6l12 12M18 6L6 18" /></Dasar>
export const IkonKunci = (p) => <Dasar {...p}><rect x="5" y="11" width="14" height="9" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Dasar>
export const IkonPensil = (p) => <Dasar {...p}><path d="M4 20l1-4L16 5l3 3L8 19z" /><path d="M14 7l3 3" /></Dasar>
export const IkonLonceng = (p) => <Dasar {...p}><path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7z" /><path d="M10 20a2 2 0 0 0 4 0" /></Dasar>
export const IkonFilter = (p) => <Dasar {...p}><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></Dasar>
export const IkonPanah = (p) => <Dasar strokeWidth="2" {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Dasar>
export const IkonRumah = (p) => <Dasar {...p}><path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></Dasar>
export const IkonKeranjang = (p) => <Dasar {...p}><path d="M5 9h14l-1.5 10a2 2 0 0 1-2 1.7h-7a2 2 0 0 1-2-1.7z" /><path d="M8 9l3-5M16 9l-3-5" /></Dasar>
export const IkonOrang = (p) => <Dasar {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Dasar>
export const IkonMenu = (p) => <Dasar strokeWidth="2" {...p}><path d="M4 7h16M4 12h10M4 17h16" /></Dasar>
export const IkonChat = (p) => <Dasar {...p}><path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.2A8 8 0 1 1 21 12z" /><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" /></Dasar>
export const IkonKeluar = (p) => <Dasar {...p}><path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" /><path d="M16 8l4 4-4 4M20 12H9" /></Dasar>
export const IkonPiala = (p) => <Dasar {...p}><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H4v2a3 3 0 0 0 4 2.8M16 6h4v2a3 3 0 0 1-4 2.8M12 13v4M8 20h8" /></Dasar>
export const IkonBuku = (p) => <Dasar {...p}><path d="M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13C17 4 14 4.5 12 6z" /><path d="M12 6v13" /></Dasar>
export const IkonJelajah = (p) => <Dasar {...p}><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></Dasar>
export const IkonPlus = (p) => <Dasar strokeWidth="2.2" {...p}><path d="M12 5v14M5 12h14" /></Dasar>
export const IkonBulan = (p) => <Dasar {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></Dasar>
export const IkonMatahari = (p) => <Dasar {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></Dasar>
export const IkonKalender = (p) => <Dasar {...p}><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M8 3v4M16 3v4M3.5 10h17" /></Dasar>
