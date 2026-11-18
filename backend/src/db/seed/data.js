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
// Langkah: [fase (p/m), teks, timerMenit?]. Bahan yang namanya muncul di teks otomatis ditautkan ke langkah.
export const resep = [
  {
    judul: 'Ayam Kecap Rice Cooker', kategori: 'Rice cooker', persiapan: 10, memasak: 20, kesulitan: 'mudah',
    deskripsi: 'Ayam manis gurih yang matang sendiri di rice cooker.',
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
    judul: 'Telur Dadar Tahu', kategori: 'Lauk', persiapan: 4, memasak: 8, kesulitan: 'mudah',
    bahan: [['Telur', 2, 'u'], ['Tahu', 1, 'u'], ['Daun bawang', 10, 'o'], ['Garam', 2, 'b'], ['Minyak goreng', 20, 'b']],
    langkah: [
      ['p', 'Hancurkan 1 butir tahu, kocok bersama 2 butir telur dan 2 g garam. Iris 10 g daun bawang.'],
      ['m', 'Panaskan 20 ml minyak goreng, tuang adonan, masak 4 menit sampai kuning keemasan.', 4],
      ['m', 'Balik dan masak 2 menit lagi, lalu angkat.', 2],
    ],
  },
  {
    judul: 'Nasi Goreng Telur', kategori: 'Nasi', persiapan: 5, memasak: 10, kesulitan: 'mudah',
    bahan: [['Nasi', 200, 'u'], ['Telur', 1, 'u'], ['Kecap manis', 15, 'u'], ['Bawang putih', 5, 'b'], ['Garam', 2, 'b'], ['Minyak goreng', 15, 'b'], ['Cabai rawit', 2, 'o']],
    langkah: [
      ['p', 'Cincang 5 g bawang putih dan iris 2 butir cabai rawit.'],
      ['m', 'Tumis bawang putih dengan 15 ml minyak goreng 1 menit, masukkan 1 butir telur dan orak-arik.', 1],
      ['m', 'Masukkan 200 g nasi, 15 ml kecap manis, dan 2 g garam. Aduk rata 5 menit.', 5],
    ],
  },
  {
    judul: 'Kangkung Bawang Putih', kategori: 'Lauk', persiapan: 5, memasak: 15, kesulitan: 'mudah',
    bahan: [['Kangkung', 200, 'u'], ['Bawang putih', 10, 'b'], ['Garam', 3, 'b'], ['Minyak goreng', 15, 'b'], ['Saus tiram', 15, 'o'], ['Cabai rawit', 2, 'o']],
    langkah: [
      ['p', 'Petik 200 g kangkung, cuci bersih. Iris 10 g bawang putih.'],
      ['m', 'Tumis bawang putih dengan 15 ml minyak goreng sampai harum.', 2],
      ['m', 'Masukkan kangkung, 3 g garam, dan 15 ml saus tiram. Masak 3 menit lalu sajikan.', 3],
    ],
  },
  {
    judul: 'Tumis Bayam', kategori: 'Lauk', persiapan: 5, memasak: 15, kesulitan: 'mudah',
    bahan: [['Bayam', 200, 'u'], ['Bawang putih', 8, 'b'], ['Garam', 3, 'b'], ['Minyak goreng', 15, 'b']],
    langkah: [
      ['p', 'Cuci 200 g bayam dan cincang 8 g bawang putih.'],
      ['m', 'Tumis bawang putih dengan 15 ml minyak goreng sampai harum.', 2],
      ['m', 'Masukkan bayam dan 3 g garam, aduk 2 menit sampai layu lalu angkat.', 2],
    ],
  },
  {
    judul: 'Telur Kukus Jagung', kategori: 'Lauk', persiapan: 5, memasak: 10, kesulitan: 'mudah',
    alat: [['Kukusan', 'panci juga bisa']],
    bahan: [['Telur', 2, 'u'], ['Jagung', 50, 'u'], ['Daun bawang', 5, 'o'], ['Garam', 2, 'b'], ['Air', 100, 'b']],
    langkah: [
      ['p', 'Kocok 2 butir telur dengan 100 ml air dan 2 g garam. Campur 50 g jagung.'],
      ['m', 'Tuang ke wadah tahan panas, kukus 10 menit di kukusan.', 10],
      ['m', 'Taburi 5 g daun bawang iris dan sajikan.'],
    ],
  },
  {
    judul: 'Tempe Kecap Rice Cooker', kategori: 'Rice cooker', persiapan: 10, memasak: 20, kesulitan: 'mudah',
    alat: [['Rice cooker', 'panci juga bisa']],
    bahan: [['Tempe', 200, 'u'], ['Kecap manis', 30, 'u'], ['Bawang putih', 10, 'b'], ['Garam', 3, 'b'], ['Air', 80, 'b'], ['Cabai rawit', 3, 'o']],
    langkah: [
      ['p', 'Potong dadu 200 g tempe. Cincang 10 g bawang putih.'],
      ['m', 'Masukkan tempe, bawang putih, 30 ml kecap manis, 3 g garam, dan 80 ml air ke rice cooker. Tekan Cook.', 20],
      ['m', 'Aduk, tambahkan 3 butir cabai rawit iris jika suka, lalu sajikan.'],
    ],
  },
  {
    judul: 'Bakwan Bayam Jagung', kategori: 'Camilan', persiapan: 10, memasak: 15, kesulitan: 'sedang',
    bahan: [['Bayam', 100, 'u'], ['Jagung', 100, 'u'], ['Tepung terigu', 100, 'u'], ['Telur', 1, 'u'], ['Garam', 3, 'b'], ['Air', 100, 'b'], ['Minyak goreng', 150, 'b'], ['Daun bawang', 10, 'o']],
    langkah: [
      ['p', 'Campur 100 g tepung terigu, 1 butir telur, 100 ml air, dan 3 g garam hingga kental.'],
      ['p', 'Masukkan 100 g bayam iris, 100 g jagung, dan 10 g daun bawang. Aduk rata.'],
      ['m', 'Goreng sesendok adonan dalam 150 ml minyak goreng panas, 3 menit tiap sisi.', 6],
    ],
  },
  {
    judul: 'Tempe Bacem', kategori: 'Lauk', persiapan: 10, memasak: 60, kesulitan: 'sedang',
    bahan: [['Tempe', 300, 'u'], ['Gula merah', 50, 'u'], ['Kecap manis', 60, 'u'], ['Bawang putih', 10, 'b'], ['Bawang merah', 15, 'b'], ['Ketumbar', 3, 'b'], ['Garam', 5, 'b'], ['Air', 500, 'b'], ['Daun salam', 2, 'o']],
    langkah: [
      ['p', 'Haluskan 10 g bawang putih, 15 g bawang merah, dan 3 g ketumbar.'],
      ['m', 'Rebus 300 g tempe dengan bumbu halus, 50 g gula merah, 60 ml kecap manis, 5 g garam, dan 500 ml air.', 50],
      ['m', 'Angkat tempe saat air menyusut, lalu panggang atau goreng sebentar 5 menit.', 5],
    ],
  },
  {
    judul: 'Kari Ayam', kategori: 'Lauk', persiapan: 15, memasak: 60, kesulitan: 'sedang',
    bahan: [['Ayam', 400, 'u'], ['Santan', 200, 'u'], ['Kentang', 2, 'u'], ['Wortel', 1, 'u'], ['Kari bubuk', 15, 'u'], ['Bawang putih', 10, 'b'], ['Bawang merah', 20, 'b'], ['Garam', 5, 'b'], ['Air', 300, 'b'], ['Minyak goreng', 30, 'b']],
    langkah: [
      ['p', 'Potong 400 g ayam, 2 butir kentang, dan 1 butir wortel. Haluskan 10 g bawang putih dan 20 g bawang merah.'],
      ['m', 'Tumis bumbu halus dan 15 g kari bubuk dengan 30 ml minyak goreng sampai harum.', 5],
      ['m', 'Masukkan ayam, 300 ml air, dan 5 g garam. Masak 25 menit.', 25],
      ['m', 'Tambahkan kentang, wortel, dan 200 ml santan. Masak 25 menit lagi.', 25],
    ],
  },
  {
    judul: 'Nasi Goreng Zero-Waste Sinta', kategori: 'Nasi', persiapan: 5, memasak: 15, kesulitan: 'mudah', eksklusif: true,
    bahan: [['Nasi', 250, 'u'], ['Telur', 1, 'u'], ['Wortel', 1, 'u'], ['Kecap manis', 15, 'u'], ['Bawang putih', 5, 'b'], ['Garam', 2, 'b'], ['Minyak goreng', 15, 'b']],
    langkah: [
      ['p', 'Parut 1 butir wortel dan cincang 5 g bawang putih.'],
      ['m', 'Tumis bawang putih dan wortel dengan 15 ml minyak goreng 3 menit.', 3],
      ['m', 'Masukkan 250 g nasi, 1 butir telur, 15 ml kecap manis, dan 2 g garam. Aduk 7 menit.', 7],
    ],
  },
  {
    judul: 'Mi Goreng Telur', kategori: 'Mi', persiapan: 3, memasak: 9, kesulitan: 'mudah',
    bahan: [['Mi instan', 1, 'u'], ['Telur', 1, 'u'], ['Sawi', 50, 'o'], ['Air', 400, 'b'], ['Minyak goreng', 10, 'b']],
    langkah: [
      ['p', 'Rebus 1 butir mi instan dalam 400 ml air selama 3 menit, tiriskan.', 3],
      ['m', 'Panaskan 10 ml minyak goreng, orak-arik 1 butir telur.'],
      ['m', 'Masukkan mi dan 50 g sawi, aduk dengan bumbu mi 3 menit lalu sajikan.', 3],
    ],
  },
  {
    judul: 'Sup Wortel Ayam', kategori: 'Sup', persiapan: 10, memasak: 30, kesulitan: 'mudah',
    bahan: [['Ayam', 150, 'u'], ['Wortel', 2, 'u'], ['Kentang', 1, 'u'], ['Daun bawang', 10, 'o'], ['Bawang putih', 8, 'b'], ['Garam', 4, 'b'], ['Merica bubuk', 1, 'b'], ['Air', 600, 'b']],
    langkah: [
      ['p', 'Potong 150 g ayam, 2 butir wortel, dan 1 butir kentang. Cincang 8 g bawang putih.'],
      ['m', 'Rebus ayam dan bawang putih dalam 600 ml air selama 15 menit.', 15],
      ['m', 'Masukkan wortel, kentang, 4 g garam, dan 1 g merica bubuk. Masak 15 menit, taburi 10 g daun bawang.', 15],
    ],
  },
  {
    judul: 'Orak-arik Telur Kol', kategori: 'Lauk', persiapan: 5, memasak: 10, kesulitan: 'mudah',
    bahan: [['Telur', 2, 'u'], ['Kol', 100, 'u'], ['Bawang putih', 5, 'b'], ['Garam', 2, 'b'], ['Minyak goreng', 15, 'b']],
    langkah: [
      ['p', 'Iris 100 g kol dan cincang 5 g bawang putih. Kocok 2 butir telur dengan 2 g garam.'],
      ['m', 'Tumis bawang putih dengan 15 ml minyak goreng, masukkan kol, masak 3 menit.', 3],
      ['m', 'Tuang telur kocok, orak-arik 3 menit sampai matang.', 3],
    ],
  },
  {
    judul: 'Tahu Goreng Tepung', kategori: 'Camilan', persiapan: 10, memasak: 15, kesulitan: 'mudah',
    bahan: [['Tahu', 4, 'u'], ['Tepung terigu', 50, 'u'], ['Tepung beras', 20, 'o'], ['Garam', 2, 'b'], ['Air', 60, 'b'], ['Minyak goreng', 200, 'b'], ['Bawang putih', 5, 'b']],
    langkah: [
      ['p', 'Haluskan 5 g bawang putih. Campur 50 g tepung terigu, 20 g tepung beras, 2 g garam, dan 60 ml air.'],
      ['p', 'Potong 4 butir tahu, celupkan ke adonan.'],
      ['m', 'Goreng dalam 200 ml minyak goreng panas, 4 menit tiap sisi sampai renyah.', 8],
    ],
  },
]
