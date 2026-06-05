'use client';

import { useState } from 'react';
import { Copy, Check, Terminal, File, FileCode2, Play, Box, LayoutDashboard, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const files = [
  {
    name: 'main.py',
    icon: <Play className="w-4 h-4 text-emerald-400" />,
    language: 'python',
    code: `import telebot
from config import API_TOKEN
from handlers.user import register_user_handlers
from handlers.admin import register_admin_handlers

# Inisialisasi Bot
bot = telebot.TeleBot(API_TOKEN)

# Registrasi semua module handler 
register_user_handlers(bot)
register_admin_handlers(bot)

if __name__ == "__main__":
    print("🤖 Bot Moduler Berjalan... (Tekan Ctrl+C untuk berhenti)")
    bot.polling(none_stop=True)
`
  },
  {
    name: 'config.py',
    icon: <Settings className="w-4 h-4 text-neutral-400" />,
    language: 'python',
    code: `import os
from dotenv import load_dotenv

# Memuat env variables
load_dotenv()

API_TOKEN = os.getenv('API_TOKEN')
ADMIN_USERNAME = os.getenv('ADMIN_USERNAME')

if not API_TOKEN:
    raise ValueError("API_TOKEN tidak ditemukan. Pastikan sudah diset di file .env")
`
  },
  {
    name: 'database.py',
    icon: <Box className="w-4 h-4 text-blue-400" />,
    language: 'python',
    code: `# Database Sementara (Mock)
# Idealnya diganti dengan koneksi SQLite / PostgreSQL

products_db = {
    "1": {"nama": "Netflix Premium 1 Bulan", "stok": 10, "harga": 30000},
    "2": {"nama": "Spotify Premium 1 Bulan", "stok": 5, "harga": 20000},
    "3": {"nama": "Canva Pro 1 Bulan", "stok": 0, "harga": 15000},
}

user_balances = {} 
users_db = set()
`
  },
  {
    name: 'handlers/user.py',
    icon: <FileCode2 className="w-4 h-4 text-indigo-400" />,
    language: 'python',
    code: `from telebot.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton
from database import products_db, user_balances, users_db

def register_user_handlers(bot):
    
    @bot.message_handler(commands=['start'])
    def send_welcome(message):
        chat_id = message.chat.id
        users_db.add(chat_id)
        
        # Beri hadiah awal untuk user baru (dummy)
        if chat_id not in user_balances:
            user_balances[chat_id] = 50000
        
        saldo = user_balances[chat_id]
        markup = ReplyKeyboardMarkup(resize_keyboard=True, row_width=3)
        markup.row(KeyboardButton('🏷 List Produk'), KeyboardButton('🛍 Voucher'))
        markup.row(KeyboardButton('1'), KeyboardButton('2'), KeyboardButton('3'))
        markup.row(KeyboardButton('💰 Deposit'), KeyboardButton('❓ Bantuan'))
        
        pesan = f"Halo selamat datang! 👋\\nID Kamu: {chat_id}\\nSaldo: Rp {saldo:,}\\n\\nPilih menu di bawah:"
        bot.send_message(chat_id, pesan, reply_markup=markup)

    @bot.message_handler(func=lambda message: message.text == '🏷 List Produk')
    def list_produk(message):
        pesan = "📦 *Daftar Produk Digital Kami:*\\n\\n"
        for pid, pdata in products_db.items():
            pesan += f"[{pid}] {pdata['nama']}\\nHarga: Rp {pdata['harga']:,} | Stok: {pdata['stok']}\\n\\n"
            
        markup = InlineKeyboardMarkup()
        markup.add(InlineKeyboardButton('🔥 Produk Populer', callback_data='populer'))
        bot.send_message(message.chat.id, pesan, reply_markup=markup, parse_mode='Markdown')

    @bot.callback_query_handler(func=lambda call: call.data == 'populer')
    def callback_populer(call):
        bot.answer_callback_query(call.id, "Netflix Premium adalah produk paling populer saat ini!", show_alert=True)

    @bot.message_handler(func=lambda message: message.text in products_db.keys())
    def handle_checkout(message):
        chat_id = message.chat.id
        pid = message.text
        
        if chat_id not in user_balances:
            return bot.send_message(chat_id, "Silakan ketik /start terlebih dahulu.")
            
        produk = products_db[pid]
        
        if produk['stok'] <= 0:
            return bot.send_message(chat_id, "❌ Gagal: Maaf, stok sedang kosong.")
            
        if user_balances[chat_id] < produk['harga']:
            return bot.send_message(chat_id, "❌ Gagal: Saldo kamu tidak cukup. Lakukan Deposit.")
            
        # Eksekusi Pembelian
        user_balances[chat_id] -= produk['harga']
        products_db[pid]['stok'] -= 1
        
        pesan_sukses = (
            f"✅ Pembelian Berhasil!\\n\\n"
            f"Produk: {produk['nama']}\\n"
            f"Sisa Saldo: Rp {user_balances[chat_id]:,}\\n\\n"
            f"📦 Eksekusi Info:\\n"
            f"Email: auto{pid}@store.com\\n"
            f"Pass: sukses123"
        )
        bot.send_message(chat_id, pesan_sukses)
`
  },
  {
    name: 'handlers/admin.py',
    icon: <LayoutDashboard className="w-4 h-4 text-purple-400" />,
    language: 'python',
    code: `from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton
from config import ADMIN_USERNAME
from database import products_db, user_balances, users_db

def register_admin_handlers(bot):
    
    @bot.message_handler(commands=['admin', 'loginowner'])
    def admin_dashboard(message):
        if message.from_user.username != ADMIN_USERNAME:
            return bot.send_message(message.chat.id, "❌ Akses Ditolak!", parse_mode='Markdown')
        show_admin_menu(bot, message.chat.id)

    def show_admin_menu(bot, chat_id, message_id=None):
        pesan = "👑 *PANEL ADMINISTRATOR*\\n\\nSemua kontrol 100% menggunakan tombol interaktif:"
        markup = InlineKeyboardMarkup(row_width=2)
        markup.add(
            InlineKeyboardButton('📦 Produk', callback_data='adm_produk'),
            InlineKeyboardButton('💰 Saldo User', callback_data='adm_saldo'),
            InlineKeyboardButton('📊 Statistik', callback_data='adm_stats'),
            InlineKeyboardButton('❌ Tutup Panel', callback_data='adm_close')
        )
        if message_id:
            bot.edit_message_text(pesan, chat_id, message_id, reply_markup=markup, parse_mode='Markdown')
        else:
            bot.send_message(chat_id, pesan, reply_markup=markup, parse_mode='Markdown')

    @bot.callback_query_handler(func=lambda call: call.data.startswith('adm_'))
    def admin_callback_handler(call):
        chat_id = call.message.chat.id
        if call.from_user.username != ADMIN_USERNAME:
            return bot.answer_callback_query(call.id, "❌ Akses Ditolak!")
            
        action = call.data
        
        if action == 'adm_close':
            bot.delete_message(chat_id, call.message.message_id)
        elif action == 'adm_back':
            show_admin_menu(bot, chat_id, call.message.message_id)
            
        elif action == 'adm_stats':
            stok = sum(p['stok'] for p in products_db.values())
            uang = sum(user_balances.values()) if user_balances else 0
            pesan = f"📊 *Live Statistik*\\n\\n👥 User Aktif: {len(users_db)}\\n📦 Total Stok Gudang: {stok}\\n💵 Uang Beredar: Rp {uang:,}"
            markup = InlineKeyboardMarkup().add(InlineKeyboardButton('🔙 Kembali', callback_data='adm_back'))
            bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

        # === KATALOG & EDITOR PRODUK ===
        elif action == 'adm_produk':
            pesan = "📦 *Katalog Produk*\\nSilakan pilih produk untuk menyesuaikan stok & harga:"
            markup = InlineKeyboardMarkup(row_width=1)
            for pid, pdata in products_db.items():
                markup.add(InlineKeyboardButton(f"{pdata['nama']} (Rp{pdata['harga']:,} | Stok: {pdata['stok']})", callback_data=f"adm_ep_{pid}"))
            markup.row(InlineKeyboardButton('🔙 Kembali', callback_data='adm_back'))
            bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

        elif action.startswith('adm_ep_'):
            pid = action.split('_')[2]
            if pid not in products_db:
                return bot.answer_callback_query(call.id, "❌ Produk tidak ditemukan!", show_alert=True)
                
            p = products_db[pid]
            pesan = f"🛠️ *Setel: {p['nama']}*\\n\\nHarga: Rp {p['harga']:,}\\nStok: {p['stok']}"
            markup = InlineKeyboardMarkup(row_width=4)
            markup.add(
                InlineKeyboardButton('-10 Stok', callback_data=f'adm_stk_{pid}_-10'),
                InlineKeyboardButton('-1 Stok', callback_data=f'adm_stk_{pid}_-1'),
                InlineKeyboardButton('+1 Stok', callback_data=f'adm_stk_{pid}_+1'),
                InlineKeyboardButton('+10 Stok', callback_data=f'adm_stk_{pid}_+10')
            )
            markup.add(
                InlineKeyboardButton('-10k Harga', callback_data=f'adm_hrg_{pid}_-10000'),
                InlineKeyboardButton('-1k Harga', callback_data=f'adm_hrg_{pid}_-1000'),
                InlineKeyboardButton('+1k Harga', callback_data=f'adm_hrg_{pid}_+1000'),
                InlineKeyboardButton('+10k Harga', callback_data=f'adm_hrg_{pid}_+10000')
            )
            markup.add(InlineKeyboardButton('🔙 Kembali ke Katalog', callback_data='adm_produk'))
            bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

        elif action.startswith('adm_stk_'):
            pid = action.split('_')[2]
            delta = int(action.split('_')[3])
            if pid in products_db:
                products_db[pid]['stok'] = max(0, products_db[pid]['stok'] + delta)
                # Refresh Menu Setel Produk Secara Instant
                call.data = f'adm_ep_{pid}'
                return admin_callback_handler(call)
            bot.answer_callback_query(call.id, "Produk tidak ada!")

        elif action.startswith('adm_hrg_'):
            pid = action.split('_')[2]
            delta = int(action.split('_')[3])
            if pid in products_db:
                products_db[pid]['harga'] = max(0, products_db[pid]['harga'] + delta)
                # Refresh Menu Setel Produk Secara Instant
                call.data = f'adm_ep_{pid}'
                return admin_callback_handler(call)
            bot.answer_callback_query(call.id, "Produk tidak ada!")

        # === KELOLA SALDO USER ===
        elif action == 'adm_saldo':
            pesan = "💰 *Pilih Pengguna yang Mau Disetel:*"
            markup = InlineKeyboardMarkup(row_width=1)
            
            if not user_balances:
                pesan = "⚠️ *Belum ada pengguna yang berinteraksi.*"
            else:
                for uid, saldo in user_balances.items():
                    markup.add(InlineKeyboardButton(f"ID {uid} (Rp {saldo:,})", callback_data=f"adm_usr_{uid}"))
                    
            markup.add(InlineKeyboardButton('🔙 Kembali', callback_data='adm_back'))
            bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

        elif action.startswith('adm_usr_'):
            uid = int(action.split('_')[2])
            saldo = user_balances.get(uid, 0)
            pesan = f"💳 *Setel Saldo*\\n\\nID User: {uid}\\nSaldo Saat Ini: Rp {saldo:,}"
            markup = InlineKeyboardMarkup(row_width=4)
            markup.add(
                InlineKeyboardButton('-50k', callback_data=f'adm_sld_{uid}_-50000'),
                InlineKeyboardButton('-10k', callback_data=f'adm_sld_{uid}_-10000'),
                InlineKeyboardButton('+10k', callback_data=f'adm_sld_{uid}_+10000'),
                InlineKeyboardButton('+50k', callback_data=f'adm_sld_{uid}_+50000')
            )
            markup.add(InlineKeyboardButton('🔙 Kembali ke Data User', callback_data='adm_saldo'))
            bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

        elif action.startswith('adm_sld_'):
            uid = int(action.split('_')[2])
            delta = int(action.split('_')[3])
            
            # Update Saldo 
            user_balances[uid] = max(0, user_balances.get(uid, 0) + delta)
            
            # Notifikasi ke user terkait (Bisa jadi diblokir user)
            if delta > 0:
                try:
                    bot.send_message(uid, f"💰 *Deposit Masuk* (Rp {delta:,}) ditambahkan oleh Admin! Cek menggunakan menu bantuan.", parse_mode='Markdown')
                except:
                    pass
                    
            # Refresh Menu Setel Saldo
            call.data = f'adm_usr_{uid}'
            return admin_callback_handler(call)
`
  },
  {
    name: '.env',
    icon: <File className="w-4 h-4 text-emerald-400" />,
    language: 'env',
    code: `API_TOKEN=YOUR_BOT_TOKEN_HERE
ADMIN_USERNAME=username_tanpa_at_di_sini
`
  },
  {
    name: 'requirements.txt',
    icon: <File className="w-4 h-4 text-neutral-400" />,
    language: 'text',
    code: `pyTelegramBotAPI==4.14.0
python-dotenv==1.0.0
`
  }
];

export default function WorkspacePage() {
  const [activeFile, setActiveFile] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(files[activeFile].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <motion.header 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex p-3 bg-indigo-500/10 rounded-2xl mb-5">
            <LayoutDashboard className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">Enterprise Bot Architecture</h1>
          <p className="text-neutral-400 leading-relaxed text-sm md:text-base">
            Mengubah file <code className="text-indigo-300">bot.py</code> yang monolithic menjadi struktur 
            <span className="text-neutral-200"> MVC Modular</span>.
            Terdiri dari root core, modul database, config router, dan pemisahan logika handlers admin/user agar mudah di scale menjadi project enterprise yang rapih.
          </p>
        </motion.header>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]"
        >
          {/* Sidebar / File Explorer */}
          <div className="lg:col-span-3 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
            <div className="px-4 py-3.5 border-b border-neutral-800 bg-neutral-900 flex flex-col">
               <span className="text-xs font-semibold text-neutral-500 uppercase tracking-widest pl-1">Project Explorer</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {files.map((file, idx) => (
                <button
                  key={file.name}
                  onClick={() => setActiveFile(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                    activeFile === idx 
                      ? 'bg-indigo-500/15 text-indigo-300 font-medium' 
                      : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
                  }`}
                >
                  <div className={`shrink-0 ${activeFile === idx ? 'opacity-100' : 'opacity-70'}`}>
                    {file.icon}
                  </div>
                  <span className="truncate">{file.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Editor Area */}
          <div className="lg:col-span-9 bg-[#0a0a0a] border border-neutral-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-800 opacity-80"></div>
             
             {/* Editor Header */}
             <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800/60 bg-neutral-900/60 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <Terminal className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm text-neutral-300 font-mono tracking-wide">{files[activeFile].name}</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 transition-colors border border-neutral-700/50"
                >
                  {copied ? (
                    <><Check className="w-3.5 h-3.5 text-emerald-400"/> <span className="text-emerald-400">Tersalin</span></>
                  ) : (
                    <><Copy className="w-3.5 h-3.5"/> Salin Snippet</>
                  )}
                </button>
             </div>

             {/* Code Editor View */}
             <div className="flex-1 overflow-auto p-5 md:p-7 relative font-mono text-[13.5px] leading-[1.6]">
               <AnimatePresence mode="wait">
                 <motion.div
                   key={files[activeFile].name}
                   initial={{ opacity: 0, y: 5 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -5 }}
                   transition={{ duration: 0.15 }}
                 >
                   <pre className="text-neutral-300 w-full">
                     <code className="block w-full">{files[activeFile].code}</code>
                   </pre>
                 </motion.div>
               </AnimatePresence>
             </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
