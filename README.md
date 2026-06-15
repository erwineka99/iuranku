# Iuranku

Aplikasi manajemen iuran RT berbasis web. Backend menggunakan **Laravel 13 + Sanctum**, frontend menggunakan **React 19 + TypeScript + Tailwind CSS**.

---

## Prasyarat

Pastikan perangkat berikut sudah terinstal sebelum memulai:

| Perangkat | Versi minimal |
|-----------|--------------|
| PHP | 8.3 |
| Composer | 2.x |
| Node.js | 18.x |
| npm | 9.x |
| MySQL | 8.0 |

> Disarankan menggunakan **Laragon** (Windows) karena sudah menyertakan PHP, MySQL, dan Apache/Nginx sekaligus.

---

## Struktur Direktori

```
iuranku/
├── backend/    # Laravel API
└── frontend/   # React + Vite SPA
```

---

## Instalasi Backend (Laravel)

### 1. Masuk ke direktori backend

```bash
cd backend
```

### 2. Install dependensi PHP

```bash
composer install
```

### 3. Salin file environment

```bash
cp .env.example .env
```

### 4. Generate application key

```bash
php artisan key:generate
```

### 5. Konfigurasi database

Edit file `.env` sesuai dengan setup lokal kamu:

**Menggunakan MySQL (Laragon):**
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=iuranku
DB_USERNAME=root
DB_PASSWORD=
```

### 6. Jalankan migrasi dan seeder

```bash
php artisan migrate --seed
```

Seeder akan membuat data awal berikut:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@iuranku.com | iuranku123 |
| Admin (Petugas) | petugas@iuranku.com | iuranku123 |
| Resident (penghuni) | *(dibuat otomatis dari seeder)* | iuranku123 |

Data sample yang dibuat: 5 rumah, 5 penghuni, 2 jenis iuran, tagihan Jan–Feb 2026, riwayat pembayaran, dan 5 data pengeluaran.

### 7. Jalankan server backend

```bash
php artisan serve
```

Server berjalan di `http://localhost:8000`.

---

## Instalasi Frontend (React)

### 1. Masuk ke direktori frontend

```bash
cd frontend
```

### 2. Install dependensi Node

```bash
npm install
```

### 3. Konfigurasi environment

Buat file `.env` di dalam folder `frontend/`:

```bash
cp .env .env.local
```

Atau buat manual file `.env` dengan isi:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Sesuaikan URL jika backend berjalan di port berbeda.

### 4. Jalankan dev server frontend

```bash
npm run dev
```

Frontend berjalan di `http://localhost:5173`.

---

## Menjalankan Keduanya Sekaligus

Buka dua terminal terpisah:

**Terminal 1 — Backend:**
```bash
cd backend
php artisan serve
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Lalu buka browser di `http://localhost:5173`.

---

## Akun Login Default

| Role | Email | Password | Akses |
|------|-------|----------|-------|
| Super Admin | admin@iuranku.com | iuranku123 | Semua fitur termasuk hapus data & kelola pengguna |
| Admin | petugas@iuranku.com | iuranku123 | Catat pembayaran, tagihan, pengeluaran (tanpa hapus) |
| Resident | *(dari seeder)* | nomorhp | Portal penghuni — lihat tagihan & riwayat bayar sendiri |

---

## Perintah Berguna

```bash
# Reset database dari awal (hapus semua data lalu seed ulang)
php artisan migrate:fresh --seed

# Cek apakah backend berjalan
curl http://localhost:8000/api/ping
# Response: {"message":"pong"}

# Build frontend untuk production
cd frontend
npm run build
```

---

## Tech Stack

- **Backend:** Laravel 13, Laravel Sanctum (auth token), MySQL/SQLite
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, React Router v7, Recharts, Axios