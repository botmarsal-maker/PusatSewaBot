'use client';

import { useState } from 'react';
import { Copy, Check, Terminal, Play, Bot, Package, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';

const pythonCode = `import telebot
from telebot.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton

# Masukkan Token Bot Telegram Anda di sini
# Anda bisa mendapatkan token dari @BotFather di Telegram
API_TOKEN = 'YOUR_BOT_TOKEN_HERE'
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

# Handler untuk tombol transparant / Inline Keyboard
@bot.callback_query_handler(func=lambda call: True)
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

export default function TelegramBotCodePage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
              onClick={handleCopy}
              className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md transition-colors bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Disalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Kode</span>
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

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 p-6 bg-neutral-900/50 rounded-2xl border border-neutral-800"
        >
          <h3 className="text-base font-medium flex items-center gap-2 mb-4 text-neutral-200">
            <Play className="w-4 h-4" />
            Cara Menjalankan
          </h3>
          <ol className="space-y-3 text-sm text-neutral-400 font-mono">
            <li><span className="text-neutral-600 mr-2">1.</span>pip install pyTelegramBotAPI</li>
            <li><span className="text-neutral-600 mr-2">2.</span>Ubah <span className="text-indigo-400">YOUR_BOT_TOKEN_HERE</span> dengan token dari @BotFather</li>
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
