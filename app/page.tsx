'use client';

import { useState } from 'react';
import { Copy, Check, Terminal, Play, Bot, Package, LayoutDashboard } from 'lucide-react';
import { motion } from 'motion/react';

const pythonBaseCode = `import telebot
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
products_db = {
    "1": {"nama": "Netflix Premium 1 Bulan", "stok": 10, "harga": 30000},
    "2": {"nama": "Spotify Premium 1 Bulan", "stok": 5, "harga": 20000},
    "3": {"nama": "Canva Pro 1 Bulan", "stok": 0, "harga": 15000},
}
user_balances = {} # Menyimpan saldo user berdasarkan chat_id
users_db = set() # Menyimpan semua chat_id yang berinteraksi (untuk Broadcast & Statistik)

# 2. Perintah /start & Menu Custom Bawah (ReplyKeyboardMarkup)
@bot.message_handler(commands=['start'])
def send_welcome(message):
    chat_id = message.chat.id
    users_db.add(chat_id)
    
    # Berikan saldo awal Rp50.000 jika user baru (untuk testing)
    if chat_id not in user_balances:
        user_balances[chat_id] = 50000
    
    saldo = user_balances[chat_id]
    
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

# Handler untuk tombol transparant / Inline Keyboard reguler
@bot.callback_query_handler(func=lambda call: call.data in ["next", "populer"])
def callback_query(call):
    if call.data == "next":
        bot.answer_callback_query(call.id, "Halaman selanjutnya belum tersedia.")
    elif call.data == "populer":
        bot.answer_callback_query(call.id, "Netflix Premium adalah produk paling populer!", show_alert=True)

# 4. Logika Checkout (Auto-Order)
@bot.message_handler(func=lambda message: message.text in products_db.keys())
def handle_checkout(message):
    chat_id = message.chat.id
    product_id = message.text
    
    # Pastikan user sudah ada
    if chat_id not in user_balances:
        bot.send_message(chat_id, "Silakan ketik /start terlebih dahulu.")
        return
        
    produk = products_db[product_id]
    saldo = user_balances[chat_id]
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
    user_balances[chat_id] -= harga
    products_db[product_id]["stok"] -= 1
    
    sisa_saldo = user_balances[chat_id]
    
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
`;

const pythonProAdminCode = `# ==========================================
# DASHBOARD ADMIN PROFESIONAL TERPADU
# (Gabungkan ini di bawah kode utama bot.py Anda)
# ==========================================

ADMIN_USERNAME = os.getenv('ADMIN_USERNAME')

@bot.message_handler(commands=['admin', 'loginowner'])
def admin_dashboard(message):
    chat_id = message.chat.id
    username = message.from_user.username
    
    if username != ADMIN_USERNAME:
        bot.send_message(chat_id, "❌ *Akses Ditolak!*\\nAnda bukan administrator.", parse_mode='Markdown')
        return
        
    show_admin_menu(chat_id)

def show_admin_menu(chat_id, message_id=None):
    pesan = (
        "👑 *PANEL ADMINISTRATOR* 👑\\n\\n"
        "Selamat datang di pusat kendali toko.\\n"
        "Pilih manuver yang ingin Anda atur:"
    )
    markup = InlineKeyboardMarkup(row_width=2)
    markup.add(
        InlineKeyboardButton('📦 Kelola Produk', callback_data='adm_produk'),
        InlineKeyboardButton('💰 Kelola Saldo', callback_data='adm_saldo'),
        InlineKeyboardButton('📢 Broadcast', callback_data='adm_bc'),
        InlineKeyboardButton('📊 Statistik Toko', callback_data='adm_stats'),
        InlineKeyboardButton('❌ Tutup Panel', callback_data='adm_close')
    )
    if message_id:
        bot.edit_message_text(pesan, chat_id, message_id, reply_markup=markup, parse_mode='Markdown')
    else:
        bot.send_message(chat_id, pesan, reply_markup=markup, parse_mode='Markdown')

@bot.callback_query_handler(func=lambda call: call.data.startswith('adm_'))
def admin_callback_handler(call):
    chat_id = call.message.chat.id
    username = call.from_user.username
    
    if username != ADMIN_USERNAME:
        bot.answer_callback_query(call.id, "❌ Akses Ditolak!", show_alert=True)
        return
        
    action = call.data
    
    if action == 'adm_close':
        bot.delete_message(chat_id, call.message.message_id)
        bot.answer_callback_query(call.id)
        return
        
    elif action == 'adm_back':
        show_admin_menu(chat_id, call.message.message_id)
        bot.answer_callback_query(call.id)

    elif action == 'adm_stats':
        total_stok = sum(p['stok'] for p in products_db.values())
        total_uang_beredar = sum(user_balances.values()) if user_balances else 0
        pesan = (
            "📊 *Statistik Toko Saat Ini*\\n\\n"
            f"👥 Total Pengguna: {len(users_db)}\\n"
            f"🛍 Total Variasi Produk: {len(products_db)}\\n"
            f"📦 Total Stok Gudang: {total_stok}\\n"
            f"💵 Total Uang Beredar: Rp {total_uang_beredar:,}\\n"
        )
        markup = InlineKeyboardMarkup().add(InlineKeyboardButton('🔙 Kembali', callback_data='adm_back'))
        bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

    elif action == 'adm_produk':
        pesan = "📦 *Manajemen Produk*\\n\\nPilih produk untuk diedit, atau tambah produk:"
        markup = InlineKeyboardMarkup(row_width=1)
        for pid, pdata in products_db.items():
            markup.add(InlineKeyboardButton(f"{pdata['nama']} (Stok: {pdata['stok']})", callback_data=f"adm_ep_{pid}"))
        markup.row(
            InlineKeyboardButton('➕ Tambah Baru', callback_data='adm_addprod'),
            InlineKeyboardButton('🔙 Kembali', callback_data='adm_back')
        )
        bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

    elif action.startswith('adm_ep_'): # Edit Product
        pid = action.split('_')[2]
        if pid not in products_db:
            bot.answer_callback_query(call.id, "Produk hilang!", show_alert=True)
            return
            
        p = products_db[pid]
        pesan = f"🛠️ *Detail Produk: {pid}*\\n\\nNama: {p['nama']}\\nHarga: Rp {p['harga']:,}\\nStok: {p['stok']}"
        markup = InlineKeyboardMarkup(row_width=3)
        markup.add(
            InlineKeyboardButton('📝 Nama', callback_data=f'adm_snama_{pid}'),
            InlineKeyboardButton('📦 Stok', callback_data=f'adm_sstok_{pid}'),
            InlineKeyboardButton('💰 Harga', callback_data=f'adm_sharga_{pid}')
        )
        markup.add(
            InlineKeyboardButton('🗑 Hapus Produk', callback_data=f'adm_del_{pid}'),
            InlineKeyboardButton('🔙 Kembali', callback_data='adm_produk')
        )
        bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

    elif action.startswith('adm_s'): # Set Field (nama, stok, harga)
        parts = action.split('_')
        field = parts[1][1:] # mengambil nama/stok/harga tanpa awalan 's'
        pid = parts[2]
        
        msg = bot.send_message(chat_id, f"📝 Masukkan *{field}* baru untuk ID [{pid}]:\\n*(Ketik /batal untuk membatalkan)*", parse_mode='Markdown')
        bot.register_next_step_handler(msg, process_update_field, pid, field)
        bot.answer_callback_query(call.id)
        
    elif action.startswith('adm_del_'):
        pid = action.split('_')[2]
        if pid in products_db:
            nama = products_db[pid]['nama']
            del products_db[pid]
            bot.answer_callback_query(call.id, f"Produk {nama} telah dihapus!", show_alert=True)
            admin_callback_handler(type('obj', (object,), {'data': 'adm_produk', 'message': call.message, 'from_user': call.from_user, 'id': call.id})())

    elif action == 'adm_addprod':
        msg = bot.send_message(chat_id, "➕ *Tambah Produk Baru*\\n\\nKetik detail produk dengan format:\\n${'`'}ID | Nama Produk | Harga | Stok${'`'}\\nContoh: ${'`'}4 | MLBB 86 Diamonds | 25000 | 50${'`'}\\n\\n*(Ketik /batal untuk membatalkan)*", parse_mode='Markdown')
        bot.register_next_step_handler(msg, process_add_produk)
        bot.answer_callback_query(call.id)

    elif action == 'adm_bc':
        msg = bot.send_message(chat_id, "📢 *Broadcast Message*\\n\\nKetik pesan yang akan dikirim ke seluruh pengguna:\\n*(Ketik /batal untuk membatalkan)*", parse_mode='Markdown')
        bot.register_next_step_handler(msg, process_broadcast)
        bot.answer_callback_query(call.id)
        
    elif action == 'adm_saldo':
        msg = bot.send_message(chat_id, "💰 *Kelola Saldo Pengguna*\\n\\nKetik Chat ID dan Nominal.\\nFormat: ${'`'}CHAT_ID Nominal${'`'}\\nContoh: ${'`'}123456789 50000${'`'} (untuk tambah Rp 50.000)\\n\\n*(Ketik /batal untuk membatalkan)*", parse_mode='Markdown')
        bot.register_next_step_handler(msg, process_add_saldo)
        bot.answer_callback_query(call.id)

def process_update_field(message, pid, field):
    if message.text.lower() == '/batal' or message.text.startswith('/'):
        bot.send_message(message.chat.id, "❌ Tindakan dibatalkan.")
        return
        
    try:
        val = message.text
        if field in ['stok', 'harga']:
            val = int(val)
        products_db[pid][field] = val
        bot.send_message(message.chat.id, f"✅ Sukses! Atribut *{field}* pada produk ID {pid} kini menjadi: {val}", parse_mode='Markdown')
    except ValueError:
        bot.send_message(message.chat.id, "❌ Gagal! Pastikan harga/stok menggunakan format angka (tanpa titik/koma).")

def process_add_produk(message):
    if message.text.lower() == '/batal' or message.text.startswith('/'):
        bot.send_message(message.chat.id, "❌ Tindakan dibatalkan.")
        return
        
    try:
        parts = [p.strip() for p in message.text.split('|')]
        if len(parts) != 4:
            bot.send_message(message.chat.id, "❌ Gagal! Pastikan format sesuai:\\n${'`'}ID | Nama Produk | Harga | Stok${'`'}", parse_mode='Markdown')
            return
            
        pid, nama, harga, stok = parts
        products_db[pid] = {"nama": nama, "harga": int(harga), "stok": int(stok)}
        bot.send_message(message.chat.id, f"✅ Produk *{nama}* berhasil ditambahkan ke katalog!", parse_mode='Markdown')
    except Exception as e:
        bot.send_message(message.chat.id, f"❌ Terjadi kesalahan: {e}")

def process_broadcast(message):
    if message.text.lower() == '/batal' or message.text.startswith('/'):
        bot.send_message(message.chat.id, "❌ Broadcast dibatalkan.")
        return
        
    sukses = 0
    for uid in list(users_db):
        try:
            bot.send_message(uid, f"📢 *PENGUMUMAN*\\n\\n{message.text}", parse_mode='Markdown')
            sukses += 1
        except:
            pass
    bot.send_message(message.chat.id, f"✅ Siaran Broadcast berhasil terkirim ke *{sukses}* pengguna.", parse_mode='Markdown')

def process_add_saldo(message):
    if message.text.lower() == '/batal' or message.text.startswith('/'):
        bot.send_message(message.chat.id, "❌ Tindakan dibatalkan.")
        return
        
    try:
        uid_str, nominal_str = message.text.split()
        uid = int(uid_str)
        nominal = int(nominal_str)
        
        if uid not in user_balances:
            user_balances[uid] = 0 
            
        user_balances[uid] += nominal
        bot.send_message(message.chat.id, f"✅ Saldo user ${'`'}{uid}${'`'} berhasil ditambah Rp {nominal:,}.\\nTotal Saldo Baru: Rp {user_balances[uid]:,}", parse_mode='Markdown')
        
        try:
            bot.send_message(uid, f"💰 *Deposit Masuk!*\\n\\nSelamat, saldo Anda telah ditambahkan sebesar *Rp {nominal:,}* oleh tim Admin. Selamat berbelanja!", parse_mode='Markdown')
        except:
            pass
    except ValueError:
        bot.send_message(message.chat.id, "❌ Gagal! Pastikan format sesuai: ${'`'}ID_USER NOMINAL_ANGKA${'`'}", parse_mode='Markdown')
    except Exception:
        bot.send_message(message.chat.id, "❌ Terjadi kesalahan yang tidak terduga.")

if __name__ == "__main__":
    print("Bot sedang berjalan... (Tekan Ctrl+C untuk berhenti)")
    bot.polling(none_stop=True)
`;

export default function TelegramBotCodePage() {
  const [copiedBase, setCopiedBase] = useState(false);
  const [copiedPro, setCopiedPro] = useState(false);

  const handleCopyBase = () => {
    navigator.clipboard.writeText(pythonBaseCode);
    setCopiedBase(true);
    setTimeout(() => setCopiedBase(false), 2500);
  };
  
  const handleCopyPro = () => {
    navigator.clipboard.writeText(pythonProAdminCode);
    setCopiedPro(true);
    setTimeout(() => setCopiedPro(false), 2500);
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
            Kode Python lengkap untuk sistem auto-order produk digital. Dilengkapi mock database, validasi stok, fitur user & saldo otomatis, dan 
            menu admin canggih interaktif dengan <code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">pyTelegramBotAPI</code>.
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
              <span className="text-sm font-mono text-neutral-400">bot.py (Kode Dasar Utama)</span>
            </div>
            <button
              onClick={handleCopyBase}
              className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md transition-colors bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
            >
              {copiedBase ? (
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
              <code>{pythonBaseCode}</code>
            </pre>
          </div>
        </motion.div>

        {/* PRO ADMIN CODE BLOCK */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 bg-neutral-900 rounded-2xl border border-indigo-500/50 overflow-hidden shadow-2xl relative"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-indigo-900/30">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-mono text-indigo-200">admin_dashboard.py</span>
              <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full ml-2">Fitur Pro ✨</span>
            </div>
            <button
              onClick={handleCopyPro}
              className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md transition-colors bg-indigo-950 hover:bg-indigo-900 text-indigo-300"
            >
              {copiedPro ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Disalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Setup Admin</span>
                </>
              )}
            </button>
          </div>
          <div className="p-4 overflow-x-auto bg-[#0d0d0d]">
            <pre className="text-[13px] font-mono leading-relaxed text-neutral-300">
              <code>{pythonProAdminCode}</code>
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
            Cara Menjalankan Final
          </h3>
          <ol className="space-y-3 text-sm text-neutral-400 font-mono">
            <li><span className="text-neutral-600 mr-2">1.</span>pip install pyTelegramBotAPI python-dotenv</li>
            <li><span className="text-neutral-600 mr-2">2.</span>Buat file <span className="text-indigo-400">.env</span> dan isi dengan token bot & username admin.</li>
            <li><span className="text-neutral-600 mr-2">3.</span>Gabungkan kedua kode Python di atas ke dalam <span className="text-emerald-400">bot.py</span>.</li>
            <li><span className="text-neutral-600 mr-2">4.</span>Jalankan: <code className="bg-neutral-800 px-1 py-0.5 rounded">python bot.py</code></li>
          </ol>
        </motion.div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: <LayoutDashboard className="w-4 h-4" />,
    title: "Dashboard Pro",
    desc: "Panel administratif interaktif dengan fitur manajemen nama, harga produk, & stok."
  },
  {
    icon: <Package className="w-4 h-4" />,
    title: "Sistem Saldo Terpadu",
    desc: "Melacak saldo user & tambah saldo langsung via bot."
  },
  {
    icon: <Bot className="w-4 h-4" />,
    title: "Fitur Broadcast",
    desc: "Sistem statistik dan log session interaksi untuk mengirim pesan promosi serentak."
  }
];
