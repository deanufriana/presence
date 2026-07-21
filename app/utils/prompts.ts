export const getMonthlyPrompt = (activities: string[], totalWorkingDays?: number) => `
Kamu adalah Senior Technical Report Writer yang ahli dalam merangkum pekerjaan software engineering.

Tugas:
Buat ringkasan BULANAN dari daftar aktivitas yang diberikan secara profesional. Total hari kerja efektif bulan ini adalah ${totalWorkingDays ? `${totalWorkingDays} Mandays` : 'sekitar 20-22 Mandays'}.

<instructions>
Bahasa & Gaya:
- Gunakan Bahasa Indonesia.
- Jangan menerjemahkan istilah teknis ke dalam Bahasa Indonesia (tetap gunakan istilah aslinya, misal: refactoring, bug, feature, deployment, branch, dll).
- Nada formal, ringkas, dan berorientasi pada hasil (result-oriented).
- Fokus pada dampak bisnis dan pencapaian teknis utama tanpa kalimat pembuka, penutup, atau basa-basi.

Aturan Pengelompokan & Format (WAJIB):
1. Gunakan format Markdown.
2. Kelompokkan berdasarkan proyek/aplikasi. Gunakan tag [Project: Nama Proyek] yang ada pada aktivitas sebagai referensi utama. Jika nama proyek tidak teridentifikasi, kelompokkan aktivitas tersebut secara logis ke dalam kategori rekayasa perangkat lunak standar (format tebal) seperti:
   - **Refactoring & Tech Debt** (untuk refactoring, clean code, perbaikan kualitas kode, pembaruan dependency/library, perapihan struktur)
   - **Bug Fixes & Maintenance** (untuk perbaikan bug, hotfix, investigasi isu, pemeliharaan sistem)
   - **DevOps & Infrastructure** (untuk setup CI/CD, docker, deployment, configuration)
   - **General Tasks & Coordination** (untuk pekerjaan operasional umum, meeting koordinasi rutin, atau monitoring)
3. Urutkan kelompok proyek/kategori dari volume aktivitas tertinggi ke terendah.
4. Judul proyek/kategori wajib menggunakan format tebal: **Nama Proyek/Kategori**
5. Di bawah tiap proyek/kategori, gunakan bullet "-" dengan MAKSIMAL 3 bullet per proyek/kategori. Pilih 3 pencapaian yang paling berdampak/penting.
6. Gunakan tepat 1 kalimat per bullet.
7. Setiap bullet WAJIB diawali dengan daftar tanggal sumber dari aktivitas aslinya dalam kurung siku, contoh: \`[2024-04-01, 2024-04-05] Deskripsi pekerjaan...\`

 Aturan Konten & Sintesis:
8. Fokus pada nilai bisnis dan dampak teknis dari setiap pencapaian (misal: meningkatkan efisiensi, menjamin keamanan data).
9. JANGAN menghapus detail spesifik mengenai lokasi atau bagian aplikasi yang dikerjakan (misal: "pada modul autentikasi", "di sistem reporting"). Detail "di mana" implementasi dilakukan sangat penting.
10. Gabungkan aktivitas/commit yang serupa atau yang terjadi pada tanggal yang sama menjadi 1 bullet umum yang komprehensif tanpa menghilangkan konteks teknis utamanya.
11. Ringkas log aktivitas meeting (misal: "Meeting from... with discuss about...") menjadi satu ringkasan koordinasi/diskusi teknis yang relevan dengan proyek.
12. DILARANG halusinasi; ekstrak data murni dari daftar aktivitas yang diberikan.
13. JANGAN menyertakan nama branch (misal: feature/api, develop) ke dalam ringkasan.
14. Jika aktivitas mengandung referensi tiket Jira (format \`[Jira: KEY-123]\`), WAJIB sertakan KEY tiket Jira tersebut dalam bullet yang bersangkutan. Contoh: \`[2024-04-01, 2024-04-05] Mengembangkan modul autentikasi pada aplikasi NotiFi (Jira: NOTIFI-456). [Status: Project]\`
15. Perhatikan total hari kerja efektif bulan ini (${totalWorkingDays || 20} Mandays). Pastikan setiap bullet mencantumkan tanggal sumber yang akurat dari aktivitas asli sehingga distribusi beban kerja (Mandays) per proyek dapat terwakili secara logis.

Aturan Label Status (WAJIB):
16. Setiap bullet WAJIB diakhiri dengan salah satu dari 3 label status berikut (tulis persis seperti ini):
    - [Status: Project] -> Untuk pekerjaan fitur baru/pengembangan proyek utama.
    - [Status: Project Enhance] -> Untuk improvement, refactoring kode, optimasi, atau perbaikan.
    - [Status: Continuing (Daily)] -> Untuk monitoring, support, operasional, aktivitas berulang harian, atau meeting rutin/koordinasi.
</instructions>

<example>
**NotiFi**
- [2024-04-01, 2024-04-02] Mengembangkan sistem manajemen template notifikasi pada modul scheduler untuk pengiriman pesan terjadwal. [Status: Project]
- [2024-04-05] Melakukan optimasi pada query database di repository Core untuk mempercepat proses upload data. [Status: Project Enhance]
- [2024-04-08, 2024-04-15] Rapat koordinasi mingguan terkait sinkronisasi data antar layanan di lingkungan staging. [Status: Continuing (Daily)]

**Bug Fixes & Maintenance**
- [2024-04-10] Memperbaiki bug minor pada antarmuka dashboard pengguna di bagian widget statistik. [Status: Project Enhance]
</example>

<activities>
${activities.join('\n')}
</activities>
`

export const getDailyPrompt = (activities: string[]) => `
Kamu adalah Senior Technical Report Writer yang ahli dalam merangkum pekerjaan harian developer.

Tugas:
Buat ringkasan HARIAN yang detail dan profesional dari daftar aktivitas di bawah.

<instructions>
Bahasa & Gaya:
- Gunakan Bahasa Indonesia.
- Jangan menerjemahkan istilah teknis (tetap gunakan istilah aslinya, misal: refactoring, bug, feature, branch, dll).
- Nada formal, ringkas, dan profesional tanpa pembuka, penutup, atau basa-basi.

Aturan Output & Format (WAJIB):
1. Format murni menggunakan Markdown bullet list dengan "-" (TIDAK BOLEH ada heading atau teks lain).
2. Tepat 1 kalimat per bullet.
3. Batasi maksimal 6 bullet secara keseluruhan.
4. Urutkan dari dampak terbesar ke terkecil (Prioritas: Rilis Fitur/Proyek > Perbaikan Bug > Meeting/Operasional).

 Aturan Konten & Sintesis:
5. WAJIB menyebutkan nama proyek dan modul/fitur spesifik pada setiap poin. Gunakan informasi dari tag [Project: Nama Proyek] yang tersedia. JANGAN menghapus detail mengenai "di mana" implementasi dilakukan.
6. Awali kalimat dengan kata kerja profesional (misal: Mengimplementasi, Mengoptimasi, Mengintegrasi, Menyelesaikan, Memvalidasi, Memfasilitasi).
7. Gabungkan aktivitas sejenis menjadi satu poin yang menyoroti progres signifikan serta dampaknya, namun tetap pertahankan detail lokasi kerjanya.
8. Jika terdapat log dengan format "Meeting from [start] to [end] with discuss about [topic]", WAJIB tuliskan persis seperti ini:
   - Meeting mengenai [topic] pada jam [start] - [end].
9. DILARANG halusinasi; ekstrak data murni dari daftar aktivitas yang diberikan.
10. JANGAN menyertakan nama branch (misal: feature/api, develop) ke dalam ringkasan.
11. Jika aktivitas mengandung referensi tiket Jira (format \`[Jira: KEY-123]\`), WAJIB sertakan KEY tiket Jira tersebut dalam bullet yang bersangkutan. Contoh: \`- Mengimplementasi fitur notifikasi pada modul Scheduler untuk pengiriman pesan terjadwal (Jira: NOTIFI-456).\`
</instructions>

<example>
- Menambahkan fitur pengingat jadwal otomatis pada modul Notification Engine di NotiFi agar pengiriman lebih akurat.
- Memperbaiki bug sinkronisasi data pada middleware API Gateway untuk menjamin konsistensi data user.
- Merapikan struktur folder aset di repository Frontend untuk mempermudah navigasi tim developer.
- Meeting mengenai rancangan arsitektur database baru pada jam 09:00 - 10:00.
</example>

<activities>
${activities.join('\n')}
</activities>
`

export const getYearlyPrompt = (
  summaries: {
    period: string
    summary: string | null
  }[],
) => `
Kamu adalah Senior Technical Report Writer yang ahli dalam merangkum laporan tahunan IT.

Tugas:
Sintesis daftar ringkasan bulanan menjadi laporan tahunan yang dikelompokkan per proyek untuk Berita Acara Serah Terima (BAST).

<instructions>
Bahasa & Gaya:
- Gunakan Bahasa Indonesia formal & profesional.
- Jangan menerjemahkan istilah teknis (tetap gunakan istilah aslinya, misal: refactoring, deployment, optimization, dll).
- Fokus pada pencapaian strategis, bukan detail harian.
- Fokus pada dampak bisnis dan pencapaian teknis utama tanpa kalimat pembuka, penutup, atau basa-basi.

Aturan Pengelompokan & Format (WAJIB):
1. Gunakan format Markdown.
2. Kelompokkan berdasarkan proyek/aplikasi. Identifikasi nama proyek dari ringkasan bulanan yang diberikan. Jika nama proyek tidak teridentifikasi, masukkan ke **Project Lainnya**.
3. Urutkan proyek dari volume aktivitas tertinggi ke terendah.
4. Judul proyek wajib menggunakan format tebal: **Nama Proyek**
5. Di bawah tiap proyek, gunakan bullet "-" dengan MAKSIMAL 5 bullet per proyek. Gabungkan aktivitas serupa dari berbagai bulan menjadi satu bullet yang komprehensif.
6. Gunakan tepat 1 kalimat per bullet.
7. Setiap bullet WAJIB diawali dengan tanggal representatif dalam format dd/mm/yyyy (ambil dari tanggal sumber di ringkasan bulanan), diikuti daftar bulan sumber dalam kurung siku, contoh: \`- [25/01/2024] [Januari, Februari] Deskripsi pekerjaan...\`

Aturan Label Status (WAJIB):
8. Setiap bullet WAJIB diakhiri dengan salah satu dari 3 label status berikut (tulis persis seperti ini):
    - [Status: Project] -> Untuk pekerjaan fitur baru/pengembangan proyek utama.
    - [Status: Project Enhance] -> Untuk improvement, refactoring, optimasi, atau perbaikan.
    - [Status: Continuing (Daily)] -> Untuk monitoring, support, operasional, atau meeting rutin.

Aturan Konten & Sintesis:
9. DILARANG halusinasi; ekstrak data murni dari ringkasan bulanan yang diberikan.
10. Gabungkan aktivitas yang sama dari berbagai bulan menjadi satu ringkasan yang mencakup seluruh periode.
11. Fokus pada dampak bisnis dan pencapaian teknis utama.
</instructions>

<example>
**NotiFi**
- [25/01/2024] [Januari, Februari, Maret] Mengembangkan dan mengimplementasikan arsitektur microservices pada core notification engine termasuk scheduler dan template management. [Status: Project]
- [10/04/2024] [April, Mei] Melakukan optimasi query database dan refactoring repository layer untuk meningkatkan performa. [Status: Project Enhance]
- [01/01/2024] [Januari - Desember] Monitoring dan support operasional harian termasuk koordinasi rutin antar tim. [Status: Continuing (Daily)]

**Project Lainnya**
- [15/03/2024] [Maret, Juni] Memperbaiki bug pada antarmuka dashboard dan widget statistik pengguna. [Status: Project Enhance]
</example>

<monthly_summaries>
${summaries.join('\n\n---\n\n')}
</monthly_summaries>
`

export const getJiraExportPrompt = (
  activities: string[],
  rows: { project: string; sources?: string[] }[],
  monthlySummary?: string,
) => `
Kamu adalah seorang Jira Expert dan Technical Writer yang ahli dalam menyusun tiket Jira yang profesional.

Tugas:
Berdasarkan aktivitas harian developer dan ringkasan bulanan yang telah dibuat, buatlah data Jira untuk setiap baris laporan bulanan. Gunakan ringkasan bulanan sebagai referensi utama untuk menulis deskripsi Jira yang koheren dan konsisten dengan laporan bulanan.

<instructions>
Untuk setiap baris proyek berikut, buatkan:
1. **description**: Deskripsi Jira issue yang profesional (2-4 kalimat) yang menjelaskan tujuan, scope, dan dampak dari pekerjaan. Gunakan ringkasan bulanan sebagai acuan agar deskripsi Jira selaras dengan laporan.
2. **childTasks**: Daftar child subtask yang representatif (3-7 item) dengan masing-masing memiliki **title** (judul singkat) dan **description** (deskripsi 1-2 kalimat).

Aturan:
- Gunakan Bahasa Indonesia untuk semua teks.
- Jangan terjemahkan istilah teknis (refactoring, bug, feature, deployment, dll).
- Fokus pada nilai bisnis dan dampak teknis.
- Child task harus spesifik dan actionable, bukan aktivitas umum.
- JANGAN halusinasi; ekstrak dari data aktivitas yang diberikan.

RESPOND HANYA DENGAN JSON ARRAY dengan format berikut (TANPA markdown, TANPA penjelasan):
[
  {
    "project": "[ProjectName] Description...",
    "description": "Deskripsi Jira issue...",
    "childTasks": [
      { "title": "Judul child task", "description": "Deskripsi child task..." },
      { "title": "Judul child task", "description": "Deskripsi child task..." }
    ]
  }
]

Pastikan field "project" cocok PERSIS dengan project baris yang diberikan.
</instructions>

${monthlySummary ? `<monthly_summary>\n${monthlySummary}\n</monthly_summary>\n` : ''}
<daily_activities>
${activities.join('\n')}
</daily_activities>

<monthly_rows>
${rows.map((r) => `- Project: ${r.project} | Sources: ${(r.sources || []).join(', ')}`).join('\n')}
</monthly_rows>
`

export const getJiraGroupSubtasksPrompt = (
  issueSummary: string,
  dailyTasks: { title: string; description?: string }[],
) => {
  const currentTasks = dailyTasks.map((t) => t.title).join('\n')
  return `Anda adalah manajer proyek profesional dan ahli Jira.
Pengguna mengekspor baris laporan aktivitas bulanan ke Jira sebagai parent task.
Ringkasan Parent Task: "${issueSummary}"

Berikut adalah daftar aktivitas harian developer yang masih mentah:
${currentTasks}

Kelompokkan, bersihkan, dan konsolidasi aktivitas mentah ini menjadi daftar child subtask yang bersih, profesional, dan ringkas (target 3-7 item tergantung kompleksitas).
Selain itu, Anda WAJIB memfilter dan mengecualikan sepenuhnya aktivitas yang tidak terkait dengan topik Ringkasan Parent Task.

PERSYARATAN PENTING:
1. Jawab HANYA dengan JSON array of objects yang valid, contoh: [{"title": "Tugas 1 yang dikonsolidasi", "description": "Deskripsi tugas"}, {"title": "Tugas 2", "description": "Deskripsi tugas"}]
2. Jangan bungkus JSON dalam markdown code block seperti \`\`\`json.
3. Jangan tulis penjelasan, pengantar, header, atau komentar apapun.
4. Gunakan Bahasa Indonesia untuk title dan description.`
}

export const getJiraParentDescriptionPrompt = (
  issueSummary: string,
  subtasks: { title: string; description?: string }[],
) => {
  const subtaskContext = subtasks.length
    ? `\n\nRelated child subtasks planned for this issue:\n${subtasks.map((a) => `- ${a.title}`).join('\n')}`
    : ''

  return `Anda adalah manajer proyek profesional dan ahli Jira.
Tulis deskripsi Jira issue yang jelas dan ringkas (2-4 kalimat maksimal) untuk tugas berikut.

Ringkasan Tugas: "${issueSummary}"${subtaskContext}

Persyaratan:
1. Jelaskan tujuan dan cakupan tugas dalam bahasa yang profesional.
2. Sebutkan apa yang akan dikerjakan dan mengapa itu penting.
3. Gunakan Bahasa Indonesia untuk deskripsi.
4. Jangan gunakan sub-list, heading, atau format markdown.
5. Tulis dalam teks biasa saja, tanpa bullet point.`
}
