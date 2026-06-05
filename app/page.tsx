'use client';

import { useState } from 'react';
import { Copy, Check, Terminal, Play, Bot, Package, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';

const pythonCode = `import telebot
import os
from dotenv import load_dotenv
from telebot.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton

# Memuat environment variables dari file .env
load_dotenv()

# Mengambil token dari environment
API_TOKEN = os.getenv('API_TOKEN')
if not API_TOKEN:
    raise ValueError("API_TOKEN tidak ditemukan. Pastikan sudah diset di file .env")

bot = telebot.TeleBot(API_TOKEN)

# 1. Database Sementara (Mock Database) menggunakan Dictionary
users_db = {}
products_db = {
    "1": {"nama": "Netflix Premium 1 Bulan", "stok": 10, "harga": 30000},
    "2": {"nama": "Spotify Premium 1 Bulan", "stok": 5, "harga": 20000},
    "3": {"nama": "Canva Pro 1 Bulan", "stok": 0, "harga": 15000},
}

# 2. Perintah /start & Menu Custom Bawah (ReplyKeyboardMarkup)
@bot.message_handler(commands=['start'])
def send_welcome(message):
    chat_id = message.chat.id
    
    # Berikan saldo awal Rp50.000 jika user baru (untuk testing)
    if chat_id not in users_db:
        users_db[chat_id] = 50000
    
    saldo = users_db[chat_id]
    
    # Membuat custom keyboard bawah (ReplyKeyboardMarkup)
    markup = ReplyKeyboardMarkup(resize_keyboard=True, row_width=3)
    # Baris 1
    markup.row(KeyboardButton('🏷 List Produk'), KeyboardButton('🛍 Voucher'), KeyboardButton('📁 Laporan Stok'))
    # Baris 2 (Angka untuk order cepat)
    markup.row(KeyboardButton('1'), KeyboardButton('2'), KeyboardButton('3'))
    # Baris 3
    markup.row(KeyboardButton('💰 Deposit'), KeyboardButton('❓ Cara Order'), KeyboardButton('⚠️ Information'))
    
    pesan = (
        f"Halo selamat datang di Bot Store Digital! 👋\\n"
        f"ID Kamu: {chat_id}\\n"
        f"Saldo saat ini: Rp {saldo:,}\\n\\n"
        f"Silakan pilih menu di bawah ini untuk memulai layanan."
    )
    
    bot.send_message(chat_id, pesan, reply_markup=markup)

# 3. Fitur List Produk (InlineKeyboardMarkup)
@bot.message_handler(func=lambda message: message.text == '🏷 List Produk')
def list_produk(message):
    chat_id = message.chat.id
    
    pesan = "Daftar Produk Digital Kami:\\n\\n"
    for pid, pdata in products_db.items():
        pesan += f"[{pid}] {pdata['nama']}\\n"
        pesan += f"Harga: Rp {pdata['harga']:,} | Stok: {pdata['stok']}\\n\\n"
        
    pesan += "Kirim teks atau tekan tombol angka 1, 2, atau 3 untuk langsung membeli."
    
    # Tombol Transparan (InlineKeyboardMarkup)
    inline_markup = InlineKeyboardMarkup()
    btn_next = InlineKeyboardButton('➡️ Selanjutnya', callback_data='next')
    btn_populer = InlineKeyboardButton('🔥 PRODUK POPULER', callback_data='populer')
    inline_markup.row(btn_next, btn_populer)
    
    bot.send_message(chat_id, pesan, reply_markup=inline_markup)

# Handler untuk tombol transparant / Inline Keyboard (Diganti logic supaya tidak bocor ke callback admin)
@bot.callback_query_handler(func=lambda call: call.data in ["next", "populer"])
def callback_query(call):
    if call.data == "next":
        bot.answer_callback_query(call.id, "Halaman selanjutnya belum tersedia.")
    elif call.data == "populer":
        bot.answer_callback_query(call.id, "Netflix Premium adalah produk paling populer!", show_alert=True)

# 4. Logika Checkout (Auto-Order)
@bot.message_handler(func=lambda message: message.text in ['1', '2', '3'])
def handle_checkout(message):
    chat_id = message.chat.id
    product_id = message.text
    
    # Pastikan user sudah pernah /start
    if chat_id not in users_db:
        bot.send_message(chat_id, "Silakan ketik /start terlebih dahulu.")
        return
        
    produk = products_db[product_id]
    saldo = users_db[chat_id]
    harga = produk["harga"]
    stok = produk["stok"]
    nama_produk = produk["nama"]
    
    # Validasi 1: Cek Stok > 0
    if stok <= 0:
        bot.send_message(chat_id, f"❌ Gagal: Maaf, stok untuk produk {nama_produk} sedang kosong.")
        return
        
    # Validasi 2: Cek Saldo >= Harga
    if saldo < harga:
        bot.send_message(chat_id, f"❌ Gagal: Saldo kamu (Rp {saldo:,}) tidak cukup untuk membeli {nama_produk} seharga Rp {harga:,}.\\nSilakan lakukan Deposit.")
        return
        
    # Eksekusi Pembelian
    users_db[chat_id] -= harga
    products_db[product_id]["stok"] -= 1
    
    sisa_saldo = users_db[chat_id]
    
    # Pesan sukses beserta detail akun dummy
    pesan_sukses = (
        f"✅ Pembelian Berhasil!\\n\\n"
        f"Produk: {nama_produk}\\n"
        f"Harga: Rp {harga:,}\\n"
        f"Sisa Saldo: Rp {sisa_saldo:,}\\n\\n"
        f"📦 Detail Akun:\\n"
        f"Email: dummy{product_id}_{chat_id}@email.com\\n"
        f"Pass: pass{product_id}123\\n\\n"
        f"Terima kasih telah berbelanja!"
    )
    
    bot.send_message(chat_id, pesan_sukses)

# Handler untuk menu lain yang belum diimplementasikan
@bot.message_handler(func=lambda message: message.text in ['🛍 Voucher', '📁 Laporan Stok', '💰 Deposit', '❓ Cara Order', '⚠️ Information'])
def handle_other_menu(message):
    bot.send_message(message.chat.id, f"Anda memilih menu: {message.text}.\\nFitur ini sedang dalam pengembangan 🛠️.")

# Menjalankan bot (loop terus menerus)
if __name__ == "__main__":
    print("Bot sedang berjalan...")
    bot.polling(none_stop=True)
`;

const pythonAdminCode = `# ==========================================
# KODE TAMBAHAN: FITUR PANEL ADMIN (DAPUR TOKO)
# Tempelkan kode ini di atas: if __name__ == "__main__":
# ==========================================

# 1. Variabel Admin (Dimuat dari .env)
ADMIN_USERNAME = os.getenv('ADMIN_USERNAME')

# 2. Perintah /loginowner
@bot.message_handler(commands=['loginowner'])
def login_owner(message):
    chat_id = message.chat.id
    username = message.from_user.username
    
    # Validasi Username Telegram
    if username != ADMIN_USERNAME:
        bot.send_message(chat_id, "❌ Akses Ditolak!")
        return
        
    pesan = "Selamat datang di Panel Admin! 👨‍💻\\nSilakan pilih menu pengaturan toko:"
    
    # InlineKeyboardMarkup dengan 3 tombol
    markup = InlineKeyboardMarkup(row_width=1)
    markup.add(
        InlineKeyboardButton('📦 Update Stok', callback_data='admin_stok'),
        InlineKeyboardButton('💳 Atur Pembayaran', callback_data='admin_bayar'),
        InlineKeyboardButton('➕ Tambah Saldo', callback_data='admin_saldo')
    )
    
    bot.send_message(chat_id, pesan, reply_markup=markup)

# 3. Callback Handler Admin
@bot.callback_query_handler(func=lambda call: call.data.startswith('admin_'))
def admin_callback(call):
    chat_id = call.message.chat.id
    username = call.from_user.username
    
    # Validasi ulang di level callback
    if username != ADMIN_USERNAME:
        bot.answer_callback_query(call.id, "❌ Anda bukan admin!", show_alert=True)
        return
        
    if call.data == 'admin_stok':
        panduan = "Untuk update stok produk, ketik perintah:\\n${'`'}/updatestok [id_produk] [jumlah_baru]${'`'}\\nContoh: ${'`'}/updatestok 1 20${'`'}"
        bot.send_message(chat_id, panduan, parse_mode='Markdown')
    elif call.data == 'admin_bayar':
        bot.send_message(chat_id, "ℹ️ Panduan: Ketik /aturpembayaran [metode] [nomor_rekening]")
    elif call.data == 'admin_saldo':
        panduan = "Untuk tambah saldo user, ketik perintah:\\n${'`'}/tambahsaldo [chat_id] [jumlah]${'`'}\\nContoh: ${'`'}/tambahsaldo 1234567 50000${'`'}"
        bot.send_message(chat_id, panduan, parse_mode='Markdown')
        
    bot.answer_callback_query(call.id)

# 4. Perintah Eksekusi Admin (/updatestok)
@bot.message_handler(commands=['updatestok'])
def update_stok(message):
    chat_id = message.chat.id
    username = message.from_user.username
    
    # Validasi Username Telegram
    if username != ADMIN_USERNAME:
        bot.send_message(chat_id, "❌ Akses Ditolak!")
        return
        
    try:
        # Menangkap ID produk dan jumlah baru menggunakan split()
        # Format: /updatestok [id_produk] [jumlah_baru]
        parts = message.text.split()
        if len(parts) != 3:
            bot.send_message(chat_id, "❌ Format salah!\\nGunakan: /updatestok [id_produk] [jumlah_baru]")
            return
            
        product_id = parts[1]
        jumlah_baru = int(parts[2])
        
        # Validasi apakah ID produk ada di products_db
        if product_id not in products_db:
            bot.send_message(chat_id, f"❌ ID Produk '{product_id}' tidak ditemukan di Database!")
            return
            
        # Eksekusi Update Stok
        products_db[product_id]["stok"] = jumlah_baru
        nama_produk = products_db[product_id]["nama"]
        
        bot.send_message(chat_id, f"✅ Stok berhasil diupdate!\\n\\n📦 Produk: {nama_produk}\\n📊 Stok Baru: {jumlah_baru}")
        
    except ValueError:
        bot.send_message(chat_id, "❌ Jumlah stok harus berupa angka!")
    except Exception as e:
        bot.send_message(chat_id, f"❌ Terjadi kesalahan system: {str(e)}")
`;

const pythonInteractiveAdminCode = `# ==========================================
# 1. GANTI BAGIAN 'admin_stok' PADA CALLBACK ADMIN SEBELUMNYA MENJADI:
# ==========================================
    if call.data == 'admin_stok':
        bot.send_message(chat_id, "📦 *Daftar Produk untuk Diedit:*", parse_mode='Markdown')
        for pid, pdata in products_db.items():
            text_produk = f"[{pid}] {pdata['nama']}\\nStok: {pdata['stok']}"
            markup_edit = InlineKeyboardMarkup(row_width=2)
            markup_edit.add(
                InlineKeyboardButton('✏️ Edit Nama', callback_data=f'editnama_{pid}'),
                InlineKeyboardButton('✏️ Edit Stok', callback_data=f'editstok_{pid}')
            )
            bot.send_message(chat_id, text_produk, reply_markup=markup_edit)

# ==========================================
# 2. TAMBAHKAN BAGIAN INI DI BAWAH (SEBELUM if __name__ == "__main__":):
# ==========================================
# 5. Handler Edit Interaktif (Nama & Stok)
@bot.callback_query_handler(func=lambda call: call.data.startswith(('editnama_', 'editstok_')))
def edit_interactive_callback(call):
    chat_id = call.message.chat.id
    username = call.from_user.username
    
    if username != ADMIN_USERNAME:
        bot.answer_callback_query(call.id, "❌ Anda bukan admin!", show_alert=True)
        return
        
    action, pid = call.data.split('_')
    
    if pid not in products_db:
        bot.answer_callback_query(call.id, "❌ Produk tidak ditemukan!", show_alert=True)
        return
        
    if action == 'editnama':
        msg = bot.send_message(chat_id, f"Ketik nama produk baru untuk ID {pid}:")
        bot.register_next_step_handler(msg, process_edit_nama, pid)
    elif action == 'editstok':
        msg = bot.send_message(chat_id, f"Ketik jumlah stok baru untuk ID {pid}:")
        bot.register_next_step_handler(msg, process_edit_stok, pid)
        
    bot.answer_callback_query(call.id)

def process_edit_nama(message, pid):
    chat_id = message.chat.id
    if message.text.startswith('/'):
        bot.send_message(chat_id, "❌ Edit dibatalkan karena Anda mengirimkan perintah.")
        return
        
    nama_baru = message.text
    products_db[pid]["nama"] = nama_baru
    bot.send_message(chat_id, f"✅ Nama produk berhasil diubah menjadi {nama_baru}!")

def process_edit_stok(message, pid):
    chat_id = message.chat.id
    if message.text.startswith('/'):
        bot.send_message(chat_id, "❌ Edit dibatalkan karena Anda mengirimkan perintah.")
        return
        
    try:
        stok_baru = int(message.text)
        products_db[pid]["stok"] = stok_baru
        bot.send_message(chat_id, f"✅ Stok produk ID {pid} berhasil diubah menjadi {stok_baru}!")
    except ValueError:
        bot.send_message(chat_id, "❌ Gagal! Stok harus berupa angka.")
`;

export default function TelegramBotCodePage() {
  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);
  const [copiedInteractive, setCopiedInteractive] = useState(false);

  const handleCopyMain = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopiedMain(true);
    setTimeout(() => setCopiedMain(false), 2500);
  };
  
  const handleCopyAdmin = () => {
    navigator.clipboard.writeText(pythonAdminCode);
    setCopiedAdmin(true);
    setTimeout(() => setCopiedAdmin(false), 2500);
  };

  const handleCopyInteractive = () => {
    navigator.clipboard.writeText(pythonInteractiveAdminCode);
    setCopiedInteractive(true);
    setTimeout(() => setCopiedInteractive(false), 2500);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 px-4 py-12 font-sans selection:bg-indigo-500/30">
      <div className="mx-auto max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-6">
            <Bot className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">Telegram Bot Auto-Order</h1>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Kode Python lengkap untuk sistem auto-order produk digital. Dilengkapi mock database, validasi stok, dan 
            menu interaktif dengan <code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">pyTelegramBotAPI</code>.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
        >
          {features.map((feature, idx) => (
            <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <div className="bg-neutral-800 w-10 h-10 rounded-lg flex items-center justify-center mb-4 text-neutral-300">
                {feature.icon}
              </div>
              <h3 className="text-sm font-medium text-neutral-200 mb-2">{feature.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-2xl"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-neutral-500" />
              <span className="text-sm font-mono text-neutral-400">bot.py</span>
            </div>
            <button
              onClick={handleCopyMain}
              className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md transition-colors bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
            >
              {copiedMain ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Disalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Kode Utama</span>
                </>
              )}
            </button>
          </div>
          <div className="p-4 overflow-x-auto bg-[#0d0d0d]">
            <pre className="text-[13px] font-mono leading-relaxed text-neutral-300">
              <code>{pythonCode}</code>
            </pre>
          </div>
        </motion.div>

        {/* ADMIN CODE BLOCK */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-10 bg-neutral-900 rounded-2xl border border-indigo-900/50 overflow-hidden shadow-2xl relative"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-indigo-900/30">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-mono text-indigo-200">admin_panel.py</span>
              <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full ml-2">Baru ✨</span>
            </div>
            <button
              onClick={handleCopyAdmin}
              className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md transition-colors bg-indigo-950 hover:bg-indigo-900 text-indigo-300"
            >
              {copiedAdmin ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Disalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Kode Tambahan</span>
                </>
              )}
            </button>
          </div>
          <div className="p-4 overflow-x-auto bg-[#0d0d0d]">
            <pre className="text-[13px] font-mono leading-relaxed text-neutral-300">
              <code>{pythonAdminCode}</code>
            </pre>
          </div>
        </motion.div>

        {/* INTERACTIVE ADMIN CODE BLOCK */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 bg-neutral-900 rounded-2xl border border-indigo-500/50 overflow-hidden shadow-2xl relative"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-emerald-900/30">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-mono text-emerald-200">admin_interactive.py</span>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full ml-2">Update ✨</span>
            </div>
            <button
              onClick={handleCopyInteractive}
              className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md transition-colors bg-emerald-950 hover:bg-emerald-900 text-emerald-300"
            >
              {copiedInteractive ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Disalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Kode Tambahan</span>
                </>
              )}
            </button>
          </div>
          <div className="p-4 overflow-x-auto bg-[#0d0d0d]">
            <pre className="text-[13px] font-mono leading-relaxed text-neutral-300">
              <code>{pythonInteractiveAdminCode}</code>
            </pre>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 p-6 bg-neutral-900/50 rounded-2xl border border-neutral-800"
        >
          <h3 className="text-base font-medium flex items-center gap-2 mb-4 text-neutral-200">
            <Play className="w-4 h-4" />
            Cara Menjalankan
          </h3>
          <ol className="space-y-3 text-sm text-neutral-400 font-mono">
            <li><span className="text-neutral-600 mr-2">1.</span>pip install pyTelegramBotAPI python-dotenv</li>
            <li><span className="text-neutral-600 mr-2">2.</span>Buat file <span className="text-indigo-400">.env</span> lalu masukkan <span className="text-emerald-400">API_TOKEN</span> dan <span className="text-emerald-400">ADMIN_USERNAME</span></li>
            <li><span className="text-neutral-600 mr-2">3.</span>python bot.py</li>
          </ol>
        </motion.div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: <DollarSign className="w-4 h-4" />,
    title: "Sistem Saldo",
    desc: "Menggunakan dictionary lokal untuk menyimpan saldo user dengan saldo default otomatis."
  },
  {
    icon: <Package className="w-4 h-4" />,
    title: "Manajemen Stok",
    desc: "Validasi pintar untuk memastikan ketersediaan stok sebelum pesanan digital diproses."
  },
  {
    icon: <Bot className="w-4 h-4" />,
    title: "Keyboard Interaktif",
    desc: "Kombinasi sempurna ReplyKeyboardMarkup (Menu) dan InlineKeyboardMarkup (Navigasi)."
  }
];
