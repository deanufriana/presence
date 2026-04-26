export const getMonthlyPrompt = (activities: string[], monthName: string = 'Bulan ini') => `
Kamu adalah technical report writer profesional.

Tugas:
Analisis daftar aktivitas di bawah dan buatlah ringkasan BULANAN yang terstruktur.

Output harus dalam format JSON yang valid dengan struktur sebagai berikut:
{
  "summary": "Teks ringkasan dalam format Markdown. Gunakan aturan pemformatan di bawah.",
  "rows": [
    {
      "bulan": "${monthName}",
      "project": "Deskripsi singkat proyek atau fitur utama yang dikerjakan",
      "progres": "Persentase progres (mis: 100% atau 80%)",
      "done": "Status (pilih: Done, In Progress, atau Pending)",
      "status": "Tipe (pilih: Project, Project Enhance, atau Continuing (Daily))"
    }
  ]
}

Aturan untuk field "summary" (WAJIB):
1) Gunakan Bahasa Indonesia.
2) Kelompokkan berdasarkan proyek/aplikasi.
3) Urutkan proyek dari yang paling sering muncul ke paling jarang.
4) Judul proyek harus format: **Nama Proyek**
5) Di bawah tiap proyek, gunakan bullet "-" dan 1 kalimat per bullet.
6) Setiap bullet WAJIB diakhiri dengan label status: [Status: Project] atau [Status: Project Enhance] atau [Status: Continuing (Daily)].
7) Gabungkan aktivitas/commit yang mirip menjadi 1 bullet yang lebih umum.
8) Jika ada aktivitas "Meeting from... with discuss about...", ringkas menjadi kegiatan koordinasi atau diskusi teknis yang relevan.
9) Maksimal 3 bullet per proyek, pilih yang paling penting.
10) Jangan gunakan pembuka/penutup, langsung ke poin-poin proyek.

Aturan untuk field "rows" (Tabel):
- Gunakan "${monthName}" untuk semua nilai di kolom "bulan".
- Buat maksimal 5 baris tabel yang mewakili proyek-proyek utama bulan ini.
- Pastikan status pekerjaan (done) dan tipe status (status) akurat berdasarkan aktivitas.

PENTING: Hanya berikan output berupa JSON yang valid. Jangan ada teks penjelasan lain.

Daftar Aktivitas:
${activities.join('\n')}
`

export const getDailyPrompt = (activities: string[]) => `
Kamu adalah technical report writer.

Tugas:
Buat ringkasan HARIAN dari daftar aktivitas di bawah.

Bahasa & gaya:
- Gunakan Bahasa Indonesia.
- Nada santai tapi profesional.
- Langsung ke isi, tanpa pembuka/penutup.

Aturan output (WAJIB):
1) Format Markdown bullet list dengan "-" (tanpa heading).
2) 1 kalimat per bullet.
3) Urutkan dari dampak terbesar ke terkecil.
4) Gabungkan aktivitas kecil yang sejenis jadi 1 bullet ringkas.
5) Sebutkan nama proyek; sertakan branch jika tersedia.
6) Gunakan kata kerja hasil (mis: menambahkan, memperbaiki, menyempurnakan, merapikan, mendiskusikan).
7) Jika ada aktivitas "Meeting from [start] to [end] with discuss about [topic]", tuliskan sebagai:
   - Meeting mengenai [topic] pada jam [start] - [end].
8) Jangan halusinasi; hanya pakai informasi dari daftar aktivitas.
9) Maksimal 6 bullet total.

Contoh format:
- Menambahkan validasi form login di Project A (branch feature/auth) agar alur autentikasi lebih aman.
- Memperbaiki bug sinkronisasi data di Project B.
- Meeting mengenai integrasi payment gateway pada jam 09:00 - 10:00.

Daftar Aktivitas:
${activities.join('\n')}
`
