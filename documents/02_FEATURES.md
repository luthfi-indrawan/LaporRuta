# Features - LaporRuta

## Authentication & Authorization

### 1. Register User

Warga mendaftar dengan nama lengkap, email, dan password (minimal 8 karakter). Password di-hash secara aman. Setelah sukses, sistem otomatis membuat user dengan `role` user dan mengembalikan token autentikasi. Jika email sudah terdaftar, sistem menampilkan pesan error generik tanpa membeberkan apakah email tersebut benar-benar ada di sistem.

### 2. Login User

Verifikasi kombinasi email dan password. Sistem menerbitkan access token (berlaku 15 menit) dan refresh token (berlaku 7 hari). Saat berhasil, pengguna diarahkan ke halaman terakhir yang dikunjungi atau ke peta publik. Saat gagal, muncul pesan generik "Kredensial tidak valid". Sesi bertahan di seluruh refresh browser sampai logout eksplisit atau kedaluwarsa.

### 3. Role-Based Access Control (RBAC)

Terdapat tiga peran: user (publik), admin wilayah, dan admin pusat. Akses ditegakkan di level backend melalui middleware autentikasi dan otorisasi. Tidak mengandalkan mekanisme keamanan bawaan database.

### 4. Role-Based Routing

Setelah login, sistem memeriksa peran dan zona tugas pengguna. Admin Wilayah langsung diarahkan ke dashboard wilayahnya dengan data yang sudah terfilter. Admin Pusat diarahkan ke dashboard pusat dengan akses penuh. User biasa yang mencoba akses halaman admin akan diarahkan ke peta publik dengan pesan akses ditolak (403).

---

## Exploring Public Maps

### 1. Public Interactive Map

Peta menggunakan Leaflet.js + OpenStreetMap (tanpa API key). Menampilkan hanya laporan dengan status terverifikasi, sedang dikerjakan, atau selesai. Setiap penanda (marker) berkode warna berdasarkan kategori infrastruktur dan berkode bentuk berdasarkan status penanganan.

### 2. Marker Clustering

Di area dengan banyak laporan, penanda otomatis dikelompokkan dengan lencana jumlah. Mengklik kelompok akan memperbesar peta untuk membuka pengelompokan tersebut. Fungsi ini mencegah tampilan peta berantakan di lokasi padat.

### 3. Map Filters

Panel filter multi-select untuk kategori dan status. Filter diterapkan secara instan tanpa memuat ulang halaman. URL diperbarui secara dinamis untuk mencerminkan filter aktif sehingga bisa dibagikan.

### 4. Tag Details Card

Mengklik penanda membuka popup/kartu yang menampilkan: judul laporan, kategori, status, jumlah upvote, gambar thumbnail, dan tanggal terakhir diperbarui.

---

## Geo-tagged Reporting

### 1. Reporting Form

Field wajib: Judul (maks. 100 karakter), Deskripsi (maks. 500), Kategori (pilih dari data master), Alamat Spesifik (maks. 200), dan Lokasi Administrasi (dropdown bertingkat). Field opsional: Penanda Pin pada peta & Unggah Gambar (1–3 file, maks. 5MB, format JPG/PNG).

### 2. Multi-level Location Selector

Dropdown hierarki: Provinsi → Kota → Kecamatan → Kelurahan (kelurahan opsional). Data lokasi diisi secara manual. Setelah memilih kecamatan, mini peta otomatis memperbesar ke area distrik tersebut.

### 3. Mini Map with Pins

Setelah memilih kecamatan, muncul mini peta. Pengguna bisa meletakkan pin untuk menyempurnakan lokasi laporan. Koordinat disimpan jika tersedia; jika pengguna tidak meletakkan pin, laporan tetap diterima dengan lokasi administrasi saja.

### 4. Upload Image

Client mengirim gambar ke backend, backend melakukan validasi dan kompresi, lalu menyimpan ke storage cloud. Backend mengembalikan URL publik ke client. Jika salah satu gambar gagal diunggah, seluruh pengiriman laporan dibatalkan (atomic transaction).

### 5. Moderation Queue

Laporan baru masuk dengan status menunggu verifikasi. Laporan ini tidak muncul di peta publik sampai diverifikasi oleh admin.

### 6. The "My Reports" page

Menampilkan semua laporan yang pernah dikirim oleh pengguna yang sedang login, diurutkan terbaru dulu. Setiap item menampilkan: judul, ikon kategori, lencana status, tanggal pengiriman, thumbnail, dan jumlah upvote. Ada indikator visual "Pembaruan Baru" jika laporan diperbarui sejak kunjungan terakhir pengguna.

---

## Community Upvote System

### 1. Upvote / Toggle

Hanya laporan dengan status terverifikasi, sedang dikerjakan, atau selesai yang bisa di-upvote. Satu upvote per pengguna per laporan. Mengklik lagi akan membatalkan upvote (perilaku toggle). UI menggunakan optimistic update (jumlah berubah segera di frontend sebelum respons backend).

### 2. Real-time Upvote Sync

Perubahan jumlah upvote di-broadcast ke semua client yang sedang melihat laporan atau peta tersebut, sehingga semua pengguna melihat angka terkini tanpa refresh.

### 3. Logging Upvote

Setiap tindakan memberikan atau mencabut upvote tercatat dalam audit trail untuk transparansi.

---

## Report Lifecycle Management (Admin)

### 1. Verification / Rejection of Reports

Admin Wilayah hanya dapat melihat laporan menunggu verifikasi yang masuk ke zona tugasnya. Klik "Verifikasi" mengubah status menjadi terverifikasi dan laporan langsung muncul di peta publik. Klik "Tolak" mengubah status menjadi ditolak dengan wajib menyertakan alasan (minimal 10 karakter). Laporan yang ditolak tidak pernah muncul di peta publik.

### 2. Repair Status Update

Admin Wilayah dapat memperbarui status maju: terverifikasi → sedang dikerjakan → selesai. Perubahan mundur tidak diizinkan (kecuali oleh Admin Pusat). Saat menandai selesai, admin bisa mengunggah gambar "sesudah" perbaikan (maks. 3 gambar). Perubahan status memicu pembaruan real-time dan menyegarkan timestamp laporan.

### 3. Zone Reallocation

Admin Pusat dapat memindahkan laporan dari satu zona administratif ke zona lain. Laporan otomatis pindah dari antrian admin lama ke antrian admin baru secara real-time. Jika zona baru tidak memiliki Admin Wilayah, laporan tersebut masuk ke antrian Admin Pusat.

### 4. Override Central Admin

Admin Pusat dapat mengubah status laporan ke arah mana pun (termasuk mengembalikan status selesai ke sedang dikerjakan atau terverifikasi), menolak laporan yang sudah diverifikasi, serta mengedit metadata laporan. Semua tindakan override dicatat khusus dalam audit trail dengan penanda bahwa ini adalah tindakan penyampingan.

### 5. Priority Scoring Algorithm

Sistem menghitung skor prioritas untuk setiap laporan berdasarkan formula: jumlah upvote, bobot urgensi kategori, keberadaan koordinat lokasi, dan usia laporan. Dashboard admin secara default mengurutkan laporan berdasarkan skor prioritas tertinggi untuk membantu admin menentukan mana yang ditangani duluan.

---

## Real-Time Data Synchronisation

### 1. Real-time Public Map

Client publik berlangganan ke channel khusus. Ketika laporan diverifikasi, penanda baru muncul di peta pada koordinat yang benar (atau titik tengah distrik jika tidak ada koordinat). Ketika status berubah, warna/bentuk penanda diperbarui segera. Payload yang dikirim lengkap sehingga client tidak perlu melakukan panggilan API tambahan.

### 2. Real-time Dashboard Admin

Admin Wilayah berlangganan ke channel zona masing-masing. Admin Pusat berlangganan ke channel global. Laporan baru dan perubahan status muncul secara instan di dashboard dengan animasi sorot halus pada item baru selama beberapa detik.

### 3. Reconnection Handler

Jika koneksi real-time terputus, client menampilkan indikator "Menyambungkan kembali..." dan mencoba menyambung ulang secara otomatis tanpa perlu intervensi pengguna.

---

## Activities & Transparency

### 1. Audit Trail / Log Aktivitas

Setiap tindakan (pembuatan laporan, upvote, verifikasi, perubahan status, penolakan) tercatat lengkap dengan nama aktor dan waktu kejadian. Timeline ini ditampilkan di halaman detail laporan, diurutkan dari terbaru ke terlama, dan bersifat immutable (tidak dapat diubah). Event upvote diagregasi (misalnya "+5 upvote minggu ini") untuk mencegah timeline terlalu panjang.

### 2. Unread Indicator (Pull-based)

Saat halaman dimuat, sistem mencatat waktu kunjungan terakhir pengguna. Di halaman "Laporan Saya", laporan yang diperbarui sejak kunjungan terakhir ditandai dengan lencana titik merah atau label "Diperbarui". Lencana hilang setelah pengguna membuka halaman detail laporan tersebut. Tidak ada notifikasi push; semua berbasis pull.

---

## Administrative Hierarchy

### 1. Admin Account Management

Admin Pusat dapat mengundang admin baru melalui email, menetapkan zona tugas untuk Admin Wilayah, menonaktifkan atau mengaktifkan kembali akun admin, serta memindahkan Admin Wilayah ke zona berbeda. Terdapat proteksi: akun Admin Pusat terakhir yang tersisa tidak dapat dihapus.

### 2. Fallback Zone Without an Administrator

Saat laporan dibuat, sistem memeriksa apakah zona yang dipilih memiliki Admin Wilayah aktif. Jika tidak ada, laporan otomatis masuk ke antrian Admin Pusat dengan penanda khusus "Zona Tanpa Admin". Admin Pusat kemudian bisa menangani langsung atau menugaskan admin ke zona tersebut.
