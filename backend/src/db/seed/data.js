// Data awal (spesifikasi bagian 13). Dibaca oleh seed.js.
// Bahan: 'nama|sinonim,sinonim|kategori|satuan|bendera' — bendera: p = bisa_pokok, d = pokok_default (+ bisa_pokok)
export const bahan = `
Ayam|dada ayam,paha ayam,fillet ayam,chicken|protein|g
Telur||protein|butir
Tahu||protein|butir
Tempe||protein|g
Daging sapi|sapi,beef|protein|g
Ikan|ikan segar,fillet ikan|protein|g
Udang||protein|g
Sosis||protein|butir
Bakso||protein|butir
Ikan teri|teri|protein|g
Telur puyuh||protein|butir
Oncom||protein|g
Hati ayam|ati ayam|protein|g
Wortel||sayur|butir
Bayam||sayur|g
Kangkung||sayur|g
Kol|kubis,cabbage|sayur|g
Sawi|caisim,sawi hijau|sayur|g
Brokoli||sayur|g
Kentang||sayur|butir
Tomat||sayur|butir
Timun|mentimun|sayur|butir
Terong||sayur|butir
Buncis||sayur|g
Kacang panjang||sayur|g
Labu siam||sayur|butir
Jagung|jagung manis|sayur|g
Kembang kol||sayur|g
Pare||sayur|butir
Jamur|jamur kancing,champignon|sayur|g
Daun bawang|prei|sayur|g
Seledri||sayur|g
Cabai rawit|cabe rawit|sayur|butir
Cabai merah|cabe merah|sayur|butir
Bawang bombai|bombay|sayur|butir
Kemangi||sayur|g
Jahe||sayur|g
Lengkuas|laos|sayur|g
Kunyit||sayur|g
Serai|sereh|sayur|butir
Daun salam||sayur|butir
Jeruk nipis||sayur|butir
Tauge|kecambah|sayur|g
Kacang tanah||sayur|g
Pisang||sayur|butir
Singkong|ubi kayu|sayur|g
Ubi jalar|ubi|sayur|g
Labu kuning|waluh|sayur|g
Nasi|nasi putih|karbohidrat|g
Mi instan|indomie|karbohidrat|butir
Mi telur||karbohidrat|g
Bihun||karbohidrat|g
Spaghetti|pasta|karbohidrat|g
Makaroni||karbohidrat|g
Roti tawar|roti|karbohidrat|butir
Tepung terigu|terigu|karbohidrat|g
Tepung beras||karbohidrat|g
Tepung maizena|maizena|karbohidrat|g
Tepung tapioka|tapioka,aci|karbohidrat|g
Oat|oatmeal|karbohidrat|g
Soun||karbohidrat|g
Kecap manis||saus|ml|p
Kecap asin||saus|ml
Saus tiram||saus|ml
Saus sambal|sambal botol|saus|ml|p
Saus tomat||saus|ml
Mayones||saus|ml
Terasi|belacan|saus|g
Cuka||saus|ml
Minyak wijen||saus|ml
Santan||saus|ml
Susu cair|susu|susu|ml
Susu kental manis|skm|susu|ml
Keju||susu|g
Keju krim|cream cheese|susu|g
Krim kental|whipping cream|susu|ml
Mentega|butter,margarin|susu|g
Yogurt||susu|g
Air||bumbu|ml|d
Garam||bumbu|g|d
Minyak goreng|minyak|bumbu|ml|d
Gula pasir|gula|bumbu|g|p
Gula merah|gula jawa|bumbu|g
Merica bubuk|lada,merica,lada bubuk|bumbu|g|p
Bawang putih||bumbu|g|p
Bawang merah||bumbu|g|p
Kaldu bubuk|penyedap,kaldu ayam|bumbu|g|p
Ketumbar||bumbu|g
Kemiri||bumbu|g
Pala||bumbu|g
Kayu manis||bumbu|g
Cengkeh||bumbu|g
Jintan||bumbu|g
Bubuk cabai|cabai bubuk|bumbu|g
Kari bubuk|bumbu kari|bumbu|g
Baking powder||bumbu|g
Soda kue||bumbu|g
Ragi||bumbu|g
Madu||bumbu|ml
Asam jawa||bumbu|g
Sirup||bumbu|ml
Cokelat bubuk|coklat bubuk|bumbu|g
Kopi||bumbu|g
Teh||bumbu|g
`.trim().split('\n')

export const alat = [
  ['Kompor', true], ['Panci', true], ['Wajan', true], ['Pisau', true],
  ['Rice cooker', false], ['Microwave', false], ['Oven', false], ['Blender', false],
  ['Air fryer', false], ['Kukusan', false], ['Pemanggang roti', false],
]

export const lencana = [
  ['recipe_creator', 'Recipe Creator', 'Resep pertamamu terbit.', 1],
  ['prolific_cook', 'Prolific Cook', '10 resepmu terbit.', 10],
  ['crowd_favorite', 'Crowd Favorite', 'Satu resep mencapai 4,5★ dengan minimal 10 ulasan.', 1],
  ['sering_dimasak', 'Resep Andalan', 'Resep-resepmu dimasak total 50 kali oleh orang lain.', 50],
  ['rice_cooker_master', 'Rice Cooker Master', '5 resep terbit yang hanya butuh rice cooker.', 5],
  ['workshop_graduate', 'Workshop Graduate', 'Mengikuti 1 workshop.', 1],
]

export const mitra = [
  ['Astro', 'Bahan makanan · ±30 mnt'],
  ['Sayurbox', 'Bahan makanan · besok'],
  ['Gojek', 'Antar dari toko terdekat'],
  ['Grab', 'Antar dari toko terdekat'],
]

// [judul, tema, pengisi, harga, kursi, hariDariSekarang, bahan[[nama, jumlah]]]
export const workshop = [
  ['Masak Rice Cooker Anak Kos', 'Rice cooker', 'Chef Sinta', 35000, 30, 7, [['Ayam', 300], ['Kecap manis', 45], ['Wortel', 1], ['Bawang putih', 10], ['Cabai rawit', 2], ['Nasi', 200]]],
  ['Sarapan Kilat 15 Menit', 'Sarapan', 'Chef Rani', 35000, 25, 14, [['Telur', 2], ['Roti tawar', 2], ['Mentega', 10], ['Keju', 20]]],
  ['Tempe Jadi Istimewa', 'Tempe', 'Chef Budi', 0, 20, 21, [['Tempe', 250], ['Kecap manis', 40], ['Bawang merah', 15], ['Gula merah', 30]]],
  ['Sup Hangat Zero-Waste', 'Sup', 'Chef Sinta', 35000, 30, 28, [['Wortel', 2], ['Kentang', 2], ['Ayam', 150], ['Daun bawang', 10], ['Air', 600]]],
]

// Bahan resep: [nama, jumlah, peran] — peran: u utama, o opsional, b bumbu_dasar
// Alat: [nama, catatan?] — catatan berisi alternatif ("panci juga bisa") sehingga pengguna tanpa alat itu tetap bisa memasak.
// Langkah: [fase (p/m), teks, timerMenit?]. Bahan/alat yang namanya muncul di teks otomatis ditautkan ke langkah.
// foto: kata kunci pencarian foto di Wikimedia Commons (dipakai `npm run db:foto`).
const KW = [['Kompor'], ['Wajan']]
const KP = [['Kompor'], ['Panci']]
export const resep = [
  {
    judul: 'Ayam Kecap Rice Cooker', kategori: 'Rice cooker', persiapan: 10, memasak: 20, kesulitan: 'mudah', foto: 'ayam kecap',
    deskripsi: 'Ayam manis gurih yang matang sendiri di rice cooker. Cocok untuk anak kos tanpa kompor.',
    alat: [['Rice cooker', 'panci juga bisa']],
    bahan: [['Ayam', 300, 'u'], ['Kecap manis', 45, 'u'], ['Wortel', 1, 'u'], ['Bawang putih', 10, 'b'], ['Garam', 5, 'b'], ['Air', 100, 'b'], ['Cabai rawit', 2, 'o']],
    langkah: [
      ['p', 'Potong 300 g ayam dan 1 butir wortel. Cincang 10 g bawang putih.'],
      ['m', 'Masukkan semua ke rice cooker bersama 45 ml kecap manis, 5 g garam, dan 100 ml air. Tekan Cook.', 20],
      ['m', 'Aduk, lalu tambahkan 2 butir cabai rawit iris jika suka.'],
      ['m', 'Sajikan selagi hangat.'],
    ],
  },
  {
    judul: 'Telur Dadar Tahu', kategori: 'Lauk', persiapan: 4, memasak: 8, kesulitan: 'mudah', foto: 'tahu telur',
    deskripsi: 'Dadar tebal berisi tahu hancur, lembut di dalam dan renyah di pinggir. Lauk hemat sehari-hari.',
    alat: KW,
    bahan: [['Telur', 2, 'u'], ['Tahu', 1, 'u'], ['Daun bawang', 10, 'o'], ['Garam', 2, 'b'], ['Minyak goreng', 20, 'b']],
    langkah: [
      ['p', 'Hancurkan 1 butir tahu, kocok bersama 2 butir telur dan 2 g garam. Iris 10 g daun bawang.'],
      ['m', 'Panaskan 20 ml minyak goreng di wajan, tuang adonan, masak 4 menit sampai kuning keemasan.', 4],
      ['m', 'Balik dan masak 2 menit lagi, lalu angkat.', 2],
    ],
  },
  {
    judul: 'Nasi Goreng Telur', kategori: 'Nasi', persiapan: 5, memasak: 10, kesulitan: 'mudah', foto: 'nasi goreng indonesia',
    deskripsi: 'Nasi goreng kecap klasik untuk menghabiskan nasi semalam. Siap dalam 15 menit.',
    alat: KW,
    bahan: [['Nasi', 200, 'u'], ['Telur', 1, 'u'], ['Kecap manis', 15, 'u'], ['Bawang putih', 5, 'b'], ['Garam', 2, 'b'], ['Minyak goreng', 15, 'b'], ['Cabai rawit', 2, 'o']],
    langkah: [
      ['p', 'Cincang 5 g bawang putih dan iris 2 butir cabai rawit.'],
      ['m', 'Tumis bawang putih dengan 15 ml minyak goreng di wajan 1 menit, masukkan 1 butir telur dan orak-arik.', 1],
      ['m', 'Masukkan 200 g nasi, 15 ml kecap manis, dan 2 g garam. Aduk rata 5 menit.', 5],
    ],
  },
  {
    judul: 'Kangkung Bawang Putih', kategori: 'Lauk', persiapan: 5, memasak: 15, kesulitan: 'mudah', foto: 'tumis kangkung',
    deskripsi: 'Tumis kangkung renyah dengan aroma bawang putih dan sedikit saus tiram.',
    alat: KW,
    bahan: [['Kangkung', 200, 'u'], ['Bawang putih', 10, 'b'], ['Garam', 3, 'b'], ['Minyak goreng', 15, 'b'], ['Saus tiram', 15, 'o'], ['Cabai rawit', 2, 'o']],
    langkah: [
      ['p', 'Petik 200 g kangkung, cuci bersih. Iris 10 g bawang putih.'],
      ['m', 'Tumis bawang putih dengan 15 ml minyak goreng di wajan sampai harum.', 2],
      ['m', 'Masukkan kangkung, 3 g garam, dan 15 ml saus tiram. Masak 3 menit lalu sajikan.', 3],
    ],
  },
  {
    judul: 'Tumis Bayam', kategori: 'Lauk', persiapan: 5, memasak: 15, kesulitan: 'mudah', foto: 'tumis bayam',
    deskripsi: 'Sayur hijau paling cepat: bayam layu sebentar dengan bawang putih.',
    alat: KW,
    bahan: [['Bayam', 200, 'u'], ['Bawang putih', 8, 'b'], ['Garam', 3, 'b'], ['Minyak goreng', 15, 'b']],
    langkah: [
      ['p', 'Cuci 200 g bayam dan cincang 8 g bawang putih.'],
      ['m', 'Tumis bawang putih dengan 15 ml minyak goreng di wajan sampai harum.', 2],
      ['m', 'Masukkan bayam dan 3 g garam, aduk 2 menit sampai layu lalu angkat.', 2],
    ],
  },
  {
    judul: 'Telur Kukus Jagung', kategori: 'Lauk', persiapan: 5, memasak: 10, kesulitan: 'mudah', foto: 'chawanmushi',
    deskripsi: 'Telur kukus selembut puding dengan butiran jagung manis. Ramah untuk anak.',
    alat: [['Kompor'], ['Kukusan', 'panci juga bisa']],
    bahan: [['Telur', 2, 'u'], ['Jagung', 50, 'u'], ['Daun bawang', 5, 'o'], ['Garam', 2, 'b'], ['Air', 100, 'b']],
    langkah: [
      ['p', 'Kocok 2 butir telur dengan 100 ml air dan 2 g garam. Campur 50 g jagung.'],
      ['m', 'Tuang ke wadah tahan panas, kukus 10 menit di kukusan.', 10],
      ['m', 'Taburi 5 g daun bawang iris dan sajikan.'],
    ],
  },
  {
    judul: 'Tempe Kecap Rice Cooker', kategori: 'Rice cooker', persiapan: 10, memasak: 20, kesulitan: 'mudah', foto: 'orek tempe',
    deskripsi: 'Tempe manis legit tanpa menggoreng. Cukup potong, masukkan, tekan Cook.',
    alat: [['Rice cooker', 'panci juga bisa']],
    bahan: [['Tempe', 200, 'u'], ['Kecap manis', 30, 'u'], ['Bawang putih', 10, 'b'], ['Garam', 3, 'b'], ['Air', 80, 'b'], ['Cabai rawit', 3, 'o']],
    langkah: [
      ['p', 'Potong dadu 200 g tempe. Cincang 10 g bawang putih.'],
      ['m', 'Masukkan tempe, bawang putih, 30 ml kecap manis, 3 g garam, dan 80 ml air ke rice cooker. Tekan Cook.', 20],
      ['m', 'Aduk, tambahkan 3 butir cabai rawit iris jika suka, lalu sajikan.'],
    ],
  },
  {
    judul: 'Bakwan Bayam Jagung', kategori: 'Camilan', persiapan: 10, memasak: 15, kesulitan: 'sedang', foto: 'bakwan',
    deskripsi: 'Gorengan renyah berisi bayam dan jagung. Enak dicocol saus sambal.',
    alat: KW,
    bahan: [['Bayam', 100, 'u'], ['Jagung', 100, 'u'], ['Tepung terigu', 100, 'u'], ['Telur', 1, 'u'], ['Garam', 3, 'b'], ['Air', 100, 'b'], ['Minyak goreng', 150, 'b'], ['Daun bawang', 10, 'o']],
    langkah: [
      ['p', 'Campur 100 g tepung terigu, 1 butir telur, 100 ml air, dan 3 g garam hingga kental.'],
      ['p', 'Masukkan 100 g bayam iris, 100 g jagung, dan 10 g daun bawang. Aduk rata.'],
      ['m', 'Goreng sesendok adonan dalam 150 ml minyak goreng panas di wajan, 3 menit tiap sisi.', 6],
    ],
  },
  {
    judul: 'Tempe Bacem', kategori: 'Lauk', persiapan: 10, memasak: 60, kesulitan: 'sedang', foto: 'tempe bacem',
    deskripsi: 'Tempe direbus dalam gula merah dan rempah sampai meresap, lalu digoreng sebentar. Khas Jawa Tengah.',
    alat: [['Kompor'], ['Panci'], ['Wajan']],
    bahan: [['Tempe', 300, 'u'], ['Gula merah', 50, 'u'], ['Kecap manis', 60, 'u'], ['Bawang putih', 10, 'b'], ['Bawang merah', 15, 'b'], ['Ketumbar', 3, 'b'], ['Garam', 5, 'b'], ['Air', 500, 'b'], ['Daun salam', 2, 'o']],
    langkah: [
      ['p', 'Haluskan 10 g bawang putih, 15 g bawang merah, dan 3 g ketumbar.'],
      ['m', 'Di panci, rebus 300 g tempe dengan bumbu halus, 50 g gula merah, 60 ml kecap manis, 5 g garam, dan 500 ml air.', 50],
      ['m', 'Angkat tempe saat air menyusut, lalu goreng sebentar di wajan 5 menit.', 5],
    ],
  },
  {
    judul: 'Kari Ayam', kategori: 'Lauk', persiapan: 15, memasak: 60, kesulitan: 'sedang', foto: 'kari ayam',
    deskripsi: 'Kari ayam bersantan dengan kentang dan wortel. Kuahnya kental dan harum rempah.',
    alat: KP,
    bahan: [['Ayam', 400, 'u'], ['Santan', 200, 'u'], ['Kentang', 2, 'u'], ['Wortel', 1, 'u'], ['Kari bubuk', 15, 'u'], ['Bawang putih', 10, 'b'], ['Bawang merah', 20, 'b'], ['Garam', 5, 'b'], ['Air', 300, 'b'], ['Minyak goreng', 30, 'b']],
    langkah: [
      ['p', 'Potong 400 g ayam, 2 butir kentang, dan 1 butir wortel. Haluskan 10 g bawang putih dan 20 g bawang merah.'],
      ['m', 'Di panci, tumis bumbu halus dan 15 g kari bubuk dengan 30 ml minyak goreng sampai harum.', 5],
      ['m', 'Masukkan ayam, 300 ml air, dan 5 g garam. Masak 25 menit.', 25],
      ['m', 'Tambahkan kentang, wortel, dan 200 ml santan. Masak 25 menit lagi.', 25],
    ],
  },
  {
    judul: 'Nasi Goreng Zero-Waste Sinta', kategori: 'Nasi', persiapan: 5, memasak: 15, kesulitan: 'mudah', eksklusif: true, foto: 'nasi goreng kampung',
    deskripsi: 'Resep andalan Chef Sinta: nasi sisa dan wortel parut jadi sarapan bergizi tanpa sisa.',
    alat: KW,
    bahan: [['Nasi', 250, 'u'], ['Telur', 1, 'u'], ['Wortel', 1, 'u'], ['Kecap manis', 15, 'u'], ['Bawang putih', 5, 'b'], ['Garam', 2, 'b'], ['Minyak goreng', 15, 'b']],
    langkah: [
      ['p', 'Parut 1 butir wortel dan cincang 5 g bawang putih.'],
      ['m', 'Tumis bawang putih dan wortel dengan 15 ml minyak goreng di wajan 3 menit.', 3],
      ['m', 'Masukkan 250 g nasi, 1 butir telur, 15 ml kecap manis, dan 2 g garam. Aduk 7 menit.', 7],
    ],
  },
  {
    judul: 'Mi Goreng Telur', kategori: 'Mi', persiapan: 3, memasak: 9, kesulitan: 'mudah', foto: 'mi goreng',
    deskripsi: 'Mi instan naik kelas dengan telur orak-arik dan sawi.',
    alat: [['Kompor'], ['Panci'], ['Wajan']],
    bahan: [['Mi instan', 1, 'u'], ['Telur', 1, 'u'], ['Sawi', 50, 'o'], ['Air', 400, 'b'], ['Minyak goreng', 10, 'b']],
    langkah: [
      ['p', 'Rebus 1 butir mi instan dalam 400 ml air di panci selama 3 menit, tiriskan.', 3],
      ['m', 'Panaskan 10 ml minyak goreng di wajan, orak-arik 1 butir telur.'],
      ['m', 'Masukkan mi dan 50 g sawi, aduk dengan bumbu mi 3 menit lalu sajikan.', 3],
    ],
  },
  {
    judul: 'Sup Wortel Ayam', kategori: 'Sup', persiapan: 10, memasak: 30, kesulitan: 'mudah', foto: 'sop ayam',
    deskripsi: 'Sup bening hangat dengan ayam, wortel, dan kentang. Pas saat badan kurang fit.',
    alat: KP,
    bahan: [['Ayam', 150, 'u'], ['Wortel', 2, 'u'], ['Kentang', 1, 'u'], ['Daun bawang', 10, 'o'], ['Bawang putih', 8, 'b'], ['Garam', 4, 'b'], ['Merica bubuk', 1, 'b'], ['Air', 600, 'b']],
    langkah: [
      ['p', 'Potong 150 g ayam, 2 butir wortel, dan 1 butir kentang. Cincang 8 g bawang putih.'],
      ['m', 'Rebus ayam dan bawang putih dalam 600 ml air di panci selama 15 menit.', 15],
      ['m', 'Masukkan wortel, kentang, 4 g garam, dan 1 g merica bubuk. Masak 15 menit, taburi 10 g daun bawang.', 15],
    ],
  },
  {
    judul: 'Orak-arik Telur Kol', kategori: 'Lauk', persiapan: 5, memasak: 10, kesulitan: 'mudah', foto: 'scrambled eggs',
    deskripsi: 'Kol manis dan telur orak-arik, lauk murah yang selalu jadi.',
    alat: KW,
    bahan: [['Telur', 2, 'u'], ['Kol', 100, 'u'], ['Bawang putih', 5, 'b'], ['Garam', 2, 'b'], ['Minyak goreng', 15, 'b']],
    langkah: [
      ['p', 'Iris 100 g kol dan cincang 5 g bawang putih. Kocok 2 butir telur dengan 2 g garam.'],
      ['m', 'Tumis bawang putih dengan 15 ml minyak goreng di wajan, masukkan kol, masak 3 menit.', 3],
      ['m', 'Tuang telur kocok, orak-arik 3 menit sampai matang.', 3],
    ],
  },
  {
    judul: 'Tahu Goreng Tepung', kategori: 'Camilan', persiapan: 10, memasak: 15, kesulitan: 'mudah', foto: 'tahu goreng',
    deskripsi: 'Tahu berbalut tepung bumbu, renyah di luar dan lembut di dalam.',
    alat: KW,
    bahan: [['Tahu', 4, 'u'], ['Tepung terigu', 50, 'u'], ['Tepung beras', 20, 'o'], ['Garam', 2, 'b'], ['Air', 60, 'b'], ['Minyak goreng', 200, 'b'], ['Bawang putih', 5, 'b']],
    langkah: [
      ['p', 'Haluskan 5 g bawang putih. Campur 50 g tepung terigu, 20 g tepung beras, 2 g garam, dan 60 ml air.'],
      ['p', 'Potong 4 butir tahu, celupkan ke adonan.'],
      ['m', 'Goreng dalam 200 ml minyak goreng panas di wajan, 4 menit tiap sisi sampai renyah.', 8],
    ],
  },
  // ——— Resep untuk alat tambahan dan dapur tanpa kompor ———
  {
    judul: 'Roti Bakar Cokelat Keju', kategori: 'Sarapan', persiapan: 3, memasak: 5, kesulitan: 'mudah', foto: 'roti bakar',
    deskripsi: 'Roti bakar ala warung tenda: mentega, cokelat, dan keju parut. Sarapan 8 menit.',
    alat: [['Pemanggang roti']],
    bahan: [['Roti tawar', 2, 'u'], ['Mentega', 10, 'u'], ['Cokelat bubuk', 10, 'u'], ['Keju', 20, 'u'], ['Susu kental manis', 15, 'o']],
    langkah: [
      ['p', 'Olesi 2 butir roti tawar dengan 10 g mentega.'],
      ['m', 'Panggang di pemanggang roti 3 menit sampai kecokelatan.', 3],
      ['m', 'Taburi 10 g cokelat bubuk dan 20 g keju parut, siram 15 ml susu kental manis, lalu tangkupkan.'],
    ],
  },
  {
    judul: 'Telur Mug Microwave', kategori: 'Sarapan', persiapan: 2, memasak: 2, kesulitan: 'mudah', foto: 'omelette',
    deskripsi: 'Omelet dalam cangkir, matang 2 menit di microwave. Tanpa kompor, tanpa cuci wajan.',
    alat: [['Microwave']],
    bahan: [['Telur', 2, 'u'], ['Susu cair', 30, 'u'], ['Keju', 15, 'o'], ['Daun bawang', 5, 'o'], ['Garam', 1, 'b'], ['Merica bubuk', 1, 'b']],
    langkah: [
      ['p', 'Kocok 2 butir telur, 30 ml susu cair, 1 g garam, dan 1 g merica bubuk di mug tahan panas.'],
      ['p', 'Tambahkan 15 g keju dan 5 g daun bawang iris.'],
      ['m', 'Masak di microwave 1 menit, aduk, lalu 1 menit lagi sampai mengembang.', 2],
    ],
  },
  {
    judul: 'Kentang Goreng Air Fryer', kategori: 'Camilan', persiapan: 10, memasak: 20, kesulitan: 'mudah', foto: 'french fries',
    deskripsi: 'Kentang goreng renyah dengan sesendok minyak saja. Camilan sehat untuk nonton.',
    alat: [['Air fryer']],
    bahan: [['Kentang', 3, 'u'], ['Minyak goreng', 10, 'b'], ['Garam', 3, 'b'], ['Saus tomat', 30, 'o']],
    langkah: [
      ['p', 'Potong 3 butir kentang memanjang, rendam air 10 menit lalu keringkan.'],
      ['p', 'Aduk kentang dengan 10 ml minyak goreng dan 3 g garam.'],
      ['m', 'Masak di air fryer suhu 200°C selama 18 menit, kocok keranjang di tengah waktu.', 18],
      ['m', 'Sajikan dengan 30 ml saus tomat.'],
    ],
  },
  {
    judul: 'Tahu Crispy Air Fryer', kategori: 'Camilan', persiapan: 10, memasak: 15, kesulitan: 'mudah', foto: 'fried tofu',
    deskripsi: 'Tahu garing berbumbu bawang tanpa menggoreng. Minyak lebih sedikit, dapur tetap bersih.',
    alat: [['Air fryer']],
    bahan: [['Tahu', 4, 'u'], ['Tepung maizena', 20, 'u'], ['Bawang putih', 5, 'b'], ['Garam', 2, 'b'], ['Minyak goreng', 10, 'b'], ['Saus sambal', 20, 'o']],
    langkah: [
      ['p', 'Potong dadu 4 butir tahu. Haluskan 5 g bawang putih dengan 2 g garam, balurkan ke tahu.'],
      ['p', 'Gulingkan tahu di 20 g tepung maizena, lalu olesi 10 ml minyak goreng.'],
      ['m', 'Masak di air fryer suhu 190°C selama 15 menit sampai keemasan.', 15],
    ],
  },
  {
    judul: 'Ayam Panggang Madu', kategori: 'Panggang', persiapan: 15, memasak: 40, kesulitan: 'sedang', foto: 'roast chicken',
    deskripsi: 'Paha ayam berlapis madu dan kecap, dipanggang di oven sampai mengilap.',
    alat: [['Oven']],
    bahan: [['Ayam', 400, 'u'], ['Madu', 30, 'u'], ['Kecap manis', 20, 'u'], ['Bawang putih', 10, 'b'], ['Garam', 4, 'b'], ['Merica bubuk', 1, 'b'], ['Jeruk nipis', 1, 'o']],
    langkah: [
      ['p', 'Haluskan 10 g bawang putih, campur 30 ml madu, 20 ml kecap manis, 4 g garam, dan 1 g merica bubuk.'],
      ['p', 'Lumuri 400 g ayam dengan bumbu dan perasan 1 butir jeruk nipis. Diamkan 10 menit.'],
      ['m', 'Panggang di oven suhu 200°C selama 35 menit, olesi sisa bumbu di menit ke-20.', 35],
      ['m', 'Istirahatkan 5 menit sebelum dipotong.', 5],
    ],
  },
  {
    judul: 'Bolu Pisang Oven', kategori: 'Panggang', persiapan: 15, memasak: 45, kesulitan: 'sedang', foto: 'banana bread',
    deskripsi: 'Banana bread lembut dari pisang yang terlalu matang. Zero-waste dan wangi.',
    alat: [['Oven']],
    bahan: [['Pisang', 3, 'u'], ['Tepung terigu', 180, 'u'], ['Telur', 2, 'u'], ['Gula pasir', 80, 'u'], ['Mentega', 80, 'u'], ['Baking powder', 5, 'u'], ['Garam', 1, 'b']],
    langkah: [
      ['p', 'Lumatkan 3 butir pisang. Lelehkan 80 g mentega.'],
      ['p', 'Kocok 2 butir telur dengan 80 g gula pasir, masukkan pisang dan mentega.'],
      ['p', 'Ayak 180 g tepung terigu, 5 g baking powder, dan 1 g garam ke adonan, aduk rata.'],
      ['m', 'Tuang ke loyang, panggang di oven suhu 170°C selama 45 menit.', 45],
    ],
  },
  {
    judul: 'Smoothie Pisang Oat', kategori: 'Minuman', persiapan: 5, memasak: 1, kesulitan: 'mudah', foto: 'banana milkshake',
    deskripsi: 'Sarapan minum yang mengenyangkan: pisang, oat, susu, dan madu di blender.',
    alat: [['Blender']],
    bahan: [['Pisang', 1, 'u'], ['Oat', 30, 'u'], ['Susu cair', 200, 'u'], ['Madu', 15, 'o'], ['Yogurt', 50, 'o']],
    langkah: [
      ['p', 'Potong 1 butir pisang.'],
      ['m', 'Masukkan pisang, 30 g oat, 200 ml susu cair, 50 g yogurt, dan 15 ml madu ke blender. Haluskan 1 menit.', 1],
    ],
  },
  {
    judul: 'Overnight Oat Pisang', kategori: 'Tanpa masak', persiapan: 5, memasak: 1, kesulitan: 'mudah', foto: 'overnight oats',
    deskripsi: 'Siapkan malam ini, makan besok pagi. Tidak perlu kompor sama sekali.',
    bahan: [['Oat', 50, 'u'], ['Susu cair', 150, 'u'], ['Pisang', 1, 'u'], ['Yogurt', 50, 'o'], ['Madu', 10, 'o']],
    langkah: [
      ['p', 'Campur 50 g oat, 150 ml susu cair, dan 50 g yogurt di wadah bertutup.'],
      ['p', 'Simpan di kulkas semalaman atau minimal 4 jam.'],
      ['m', 'Pagi harinya, tambahkan 1 butir pisang iris dan 10 ml madu.'],
    ],
  },
  {
    judul: 'Salad Timun Tomat', kategori: 'Tanpa masak', persiapan: 10, memasak: 1, kesulitan: 'mudah', foto: 'cucumber tomato salad',
    deskripsi: 'Salad segar dengan perasan jeruk nipis. Pendamping lauk goreng tanpa menyalakan kompor.',
    alat: [['Pisau']],
    bahan: [['Timun', 1, 'u'], ['Tomat', 2, 'u'], ['Jeruk nipis', 1, 'u'], ['Bawang bombai', 1, 'o'], ['Garam', 1, 'b'], ['Gula pasir', 3, 'b']],
    langkah: [
      ['p', 'Potong dadu 1 butir timun dan 2 butir tomat dengan pisau. Iris tipis 1 butir bawang bombai.'],
      ['m', 'Aduk dengan perasan 1 butir jeruk nipis, 1 g garam, dan 3 g gula pasir. Sajikan dingin.'],
    ],
  },
  {
    judul: 'Nasi Liwet Rice Cooker', kategori: 'Rice cooker', persiapan: 10, memasak: 35, kesulitan: 'mudah', foto: 'nasi liwet',
    deskripsi: 'Nasi gurih wangi serai dan daun salam, dimasak sekaligus di rice cooker.',
    alat: [['Rice cooker']],
    bahan: [['Nasi', 300, 'u'], ['Ikan teri', 30, 'o'], ['Serai', 1, 'b'], ['Daun salam', 2, 'b'], ['Bawang merah', 15, 'b'], ['Bawang putih', 5, 'b'], ['Garam', 3, 'b'], ['Minyak goreng', 15, 'b'], ['Air', 150, 'b']],
    langkah: [
      ['p', 'Iris 15 g bawang merah dan 5 g bawang putih. Memarkan 1 butir serai.'],
      ['m', 'Masukkan 300 g nasi, 150 ml air, bawang, serai, 2 butir daun salam, 3 g garam, 15 ml minyak goreng, dan 30 g ikan teri ke rice cooker.'],
      ['m', 'Tekan Cook dan biarkan sampai matang, lalu aduk rata.', 30],
    ],
  },
  {
    judul: 'Pisang Goreng Kriuk', kategori: 'Camilan', persiapan: 10, memasak: 10, kesulitan: 'mudah', foto: 'pisang goreng',
    deskripsi: 'Gorengan sore favorit: pisang manis dalam balutan tepung renyah.',
    alat: KW,
    bahan: [['Pisang', 3, 'u'], ['Tepung terigu', 60, 'u'], ['Tepung beras', 20, 'u'], ['Gula pasir', 10, 'b'], ['Garam', 1, 'b'], ['Air', 80, 'b'], ['Minyak goreng', 200, 'b']],
    langkah: [
      ['p', 'Campur 60 g tepung terigu, 20 g tepung beras, 10 g gula pasir, 1 g garam, dan 80 ml air.'],
      ['p', 'Belah 3 butir pisang, celupkan ke adonan.'],
      ['m', 'Goreng dalam 200 ml minyak goreng panas di wajan 4 menit tiap sisi.', 8],
    ],
  },
]
