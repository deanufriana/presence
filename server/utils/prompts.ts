export const getMonthlyPrompt = (activities: string[]) => `
Kamu adalah technical report writer.

Tugas:
Buat ringkasan BULANAN dari daftar aktivitas di bawah.

Bahasa & gaya:
- Gunakan Bahasa Indonesia.
- Nada santai tapi profesional.
- Langsung ke isi, tanpa pembuka/penutup.

Aturan output (WAJIB):
1) Format Markdown.
2) Kelompokkan berdasarkan proyek/aplikasi.
3) Urutkan proyek dari yang paling sering muncul ke paling jarang.
4) Judul proyek harus format: **Nama Proyek**
5) Di bawah tiap proyek, gunakan bullet "-" dan 1 kalimat per bullet.
6) Setiap bullet WAJIB diakhiri dengan label status persis format: [Status: Project] atau [Status: Project Enhance] atau [Status: Continuing (Daily)].
7) Pilih status berdasarkan konteks aktivitas:
   - Project: pekerjaan fitur/proyek utama.
   - Project Enhance: improvement/refactor/optimasi/perbaikan.
   - Continuing (Daily): monitoring/support/operasional/aktivitas berulang harian.
8) Jangan gunakan status lain selain tiga status tersebut.
9) Gabungkan aktivitas/commit yang mirip menjadi 1 bullet yang lebih umum.
10) Fokus ke hasil kerja (fitur, perbaikan, refactor, integrasi), bukan detail teknis terlalu kecil.
11) Jangan halusinasi; hanya pakai informasi dari daftar aktivitas.
12) Jika nama proyek tidak jelas, pakai **Project Lainnya**.
13) Maksimal 3 bullet per proyek, pilih yang paling penting.

Contoh format:
**Nama Proyek A**
- Menambahkan fitur X untuk kebutuhan Y. [Status: Project]
- Menyempurnakan alur Z agar lebih stabil. [Status: Project Enhance]

**Nama Proyek B**
- Refactor komponen ABC untuk konsistensi implementasi. [Status: Project Enhance]

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
6) Gunakan kata kerja hasil (mis: menambahkan, memperbaiki, menyempurnakan, merapikan).
7) Jangan halusinasi; hanya pakai informasi dari daftar aktivitas.
8) Maksimal 6 bullet total.

Contoh format:
- Menambahkan validasi form login di Project A (branch feature/auth) agar alur autentikasi lebih aman.
- Memperbaiki bug sinkronisasi data di Project B.

Daftar Aktivitas:
${activities.join('\n')}
`
