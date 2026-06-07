import React from 'react';
import { Terminal, HardDrive, ShieldCheck, Settings, Download } from 'lucide-react';

export default function Page() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans px-4 py-12 md:py-24">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-4 text-center">
          <Terminal className="w-12 h-12 text-white mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight">Auto-Order Telegram Bot</h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Sistem produksi backend telah disiapkan di <em>file system</em> Anda menggunakan Python, 
            pyTelegramBotAPI, dan SQLite. Bot dikonfigurasikan dengan pembagian file modular per instruksi Anda.
          </p>
        </header>

        <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-10">
          <h2 className="text-2xl font-medium mb-6 flex items-center gap-3">
            <HardDrive className="w-6 h-6 text-neutral-400" />
            File Structure
          </h2>
          <ul className="space-y-4 font-mono text-sm">
            <li className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <span className="text-white">📄 bot.py</span>
              <span className="text-neutral-500 text-right">Main entry point, User & Admin handlers</span>
            </li>
            <li className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <span className="text-white">🗄 database.py</span>
              <span className="text-neutral-500 text-right">SQLite connection manager & operations</span>
            </li>
            <li className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <span className="text-white">⚙️ config.py</span>
              <span className="text-neutral-500 text-right">Environment variables loading module</span>
            </li>
            <li className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <span className="text-white">🔑 .env.example</span>
              <span className="text-neutral-500 text-right">Tokens, Bank settings, Admin ID template</span>
            </li>
            <li className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <span className="text-white">📦 requirements.txt</span>
              <span className="text-neutral-500 text-right">Dependencies (pyTelegramBotAPI, dotenv)</span>
            </li>
            <li className="flex justify-between items-center pt-2">
              <span className="text-white">📘 TUTORIAL_VPS_UBUNTU.md</span>
              <span className="text-neutral-500 text-right">Panduan instalasi di server Linux</span>
            </li>
          </ul>
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h3 className="text-xl font-medium mb-4 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-neutral-400" />
              Fitur Admin
            </h3>
            <ul className="list-disc list-inside text-neutral-400 space-y-2">
              <li>Command /admin (ID protected)</li>
              <li>Manajemen Produk (Tambah / Edit / Hapus)</li>
              <li>Import Stock Massal</li>
              <li>Sistem Konfirmasi Pembayaran</li>
              <li>Auto-Delivery Stok ke Email User</li>
              <li>Laporan Statistik Sederhana</li>
            </ul>
          </section>

          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h3 className="text-xl font-medium mb-4 flex items-center gap-3">
              <Settings className="w-5 h-5 text-neutral-400" />
              Fitur User
            </h3>
            <ul className="list-disc list-inside text-neutral-400 space-y-2">
              <li>Inline Keyboard Pagination (10/Page)</li>
              <li>Pengecekan Ketersediaan Stok Real-time</li>
              <li>Kalkulasi Harga Beli Multi-Item</li>
              <li>Pengiriman Foto Bukti Pembayaran</li>
              <li>Mendapatkan Produk (Email|Pass) secara instan</li>
            </ul>
          </section>
        </div>

        <div className="text-center bg-blue-900/20 border border-blue-900/50 rounded-xl p-8">
          <h3 className="text-xl font-medium text-blue-100 mb-4">Bagaimana Cara Mengunduhnya?</h3>
          <p className="text-blue-300/80 mb-6 max-w-lg mx-auto">
            Semua kode produksi (Python + SQLite) ini sekarang berada di workspace project Anda. 
            Anda dapat menggunakan menu "Export to ZIP / File" bawaan Google AI Studio untuk mengunduh kode ke komputer lokal atau server Anda.
          </p>
        </div>
      </div>
    </div>
  );
}

