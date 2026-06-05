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
from config import API_TOKEN, log_info
from handlers import user, admin

bot = telebot.TeleBot(API_TOKEN)

user.register_user_handlers(bot)
admin.register_admin_handlers(bot)

log_info("Bot Engine Starting...")
print("✅ Bot Digital Berjalan...")
bot.infinity_polling()
`
  },
  {
    name: 'config.py',
    icon: <Settings className="w-4 h-4 text-blue-400" />,
    language: 'python',
    code: `import os
import logging
from dotenv import load_dotenv

load_dotenv()

API_TOKEN = os.getenv('API_TOKEN')
OWNER_PIN = os.getenv('OWNER_PIN', '123456')

if not API_TOKEN:
    raise ValueError("API_TOKEN tidak ditemukan.")

logging.basicConfig(
    filename='bot_activity.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def log_info(message):
    logging.info(message)
    print(f"INFO: {message}")
`
  },
  {
    name: 'database.py',
    icon: <Box className="w-4 h-4 text-orange-400" />,
    language: 'python',
    code: `import json
import os
import threading

DB_FILE = 'database.json'
db_lock = threading.Lock()

default_data = {
    "products_db": {
        "1": {"nama": "Netflix Premium 1 Bulan", "stok": 10, "harga": 30000},
        "2": {"nama": "Spotify Premium 1 Bulan", "stok": 5, "harga": 20000},
        "3": {"nama": "Canva Pro 1 Bulan", "stok": 0, "harga": 15000}
    },
    "shop_info": {
        "store_name": "Toko Bot Digital",
        "admin_contact": "@admin_toko",
        "channel": "https://t.me/channel_toko",
        "rules": "1. Barang tidak bisa dikembalikan.\\n2. Proses pengiriman berjalan 24 Jam.",
        "cara_order": "1. Pilih menu List Produk.\\n2. Tekan Beli.\\n3. Produk akan dikirim."
    },
    "users_db": [],
    "orders_db": [],
    "banned_users": []
}

def load_db():
    if not os.path.exists(DB_FILE):
        with open(DB_FILE, 'w') as f:
            json.dump(default_data, f, indent=4)
        return default_data
    try:
        with open(DB_FILE, 'r') as f:
            return json.load(f)
    except Exception:
        return default_data

db = load_db()

def commit():
    with db_lock:
        try:
            with open(DB_FILE, 'w') as f:
                json.dump(db, f, indent=4)
        except Exception as e:
            print(f"Gagal save DB: {e}")
`
  },
  {
    name: 'handlers/user.py',
    icon: <FileCode2 className="w-4 h-4 text-indigo-400" />,
    language: 'python',
    code: `import datetime
import time
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton
from database import db, commit, db_lock
from config import log_info

user_locks = {}

def register_user_handlers(bot):

    @bot.message_handler(commands=['start'])
    def send_welcome(message):
        chat_id = message.chat.id
        if chat_id in db['banned_users']:
            return bot.send_message(chat_id, "❌ Anda telah diblokir dari bot ini.")
            
        with db_lock:
            if chat_id not in db['users_db']:
                db['users_db'].append(chat_id)
                commit()
                log_info(f"User baru bergabung: {chat_id}")
        
        markup = InlineKeyboardMarkup(row_width=2)
        markup.add(
            InlineKeyboardButton('📦 List Produk', callback_data='usr_produk_1'),
            InlineKeyboardButton('📜 Riwayat Pesanan', callback_data='usr_history_1')
        )
        markup.add(
            InlineKeyboardButton('❓ Cara Order', callback_data='usr_caraorder'),
            InlineKeyboardButton('⚠️ Information', callback_data='usr_info')
        )
        
        pesan = f"Halo selamat datang di *{db['shop_info'].get('store_name', 'Toko Bot')}*! 👋\\n\\nID Kamu: {chat_id}\\nPilih menu di bawah:"
        bot.send_message(chat_id, pesan, reply_markup=markup, parse_mode='Markdown')

    @bot.callback_query_handler(func=lambda call: call.data.startswith('usr_'))
    def user_menu_handler(call):
        try:
            chat_id = call.message.chat.id
            if chat_id in db['banned_users']:
                return bot.answer_callback_query(call.id, "❌ Anda telah diblokir.", show_alert=True)
                
            action = call.data
            
            if action == 'usr_back':
                markup = InlineKeyboardMarkup(row_width=2)
                markup.add(
                    InlineKeyboardButton('📦 List Produk', callback_data='usr_produk_1'),
                    InlineKeyboardButton('📜 Riwayat Pesanan', callback_data='usr_history_1')
                )
                markup.add(
                    InlineKeyboardButton('❓ Cara Order', callback_data='usr_caraorder'),
                    InlineKeyboardButton('⚠️ Information', callback_data='usr_info')
                )
                pesan = f"Halo selamat datang di *{db['shop_info'].get('store_name', 'Toko Bot')}*! 👋\\n\\nID Kamu: {chat_id}\\nPilih menu di bawah:"
                bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

            elif action.startswith('usr_produk_'):
                page = int(action.split('_')[2])
                per_page = 5
                
                products = list(db['products_db'].items())
                total_pages = max(1, (len(products) + per_page - 1) // per_page)
                
                start_idx = (page - 1) * per_page
                current_products = products[start_idx:start_idx + per_page]
                
                pesan = f"📦 *Daftar Produk Digital Kami (Hal {page}/{total_pages}):*\\n\\n"
                markup = InlineKeyboardMarkup(row_width=2)
                
                for pid, pdata in current_products:
                    pesan += f"🔹 *{pdata['nama']}*\\nHarga: Rp {pdata['harga']:,} | Stok: {pdata['stok']}\\n\\n"
                    markup.add(InlineKeyboardButton(f"🛒 Beli {pdata['nama']}", callback_data=f"buy_{pid}"))
                
                nav_buttons = []
                if page > 1:
                    nav_buttons.append(InlineKeyboardButton('⬅️ Prev', callback_data=f'usr_produk_{page-1}'))
                if page < total_pages:
                    nav_buttons.append(InlineKeyboardButton('Next ➡️', callback_data=f'usr_produk_{page+1}'))
                if nav_buttons:
                    markup.add(*nav_buttons)
                    
                markup.add(InlineKeyboardButton('🔙 Kembali', callback_data='usr_back'))
                bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

            elif action.startswith('usr_history_'):
                page = int(action.split('_')[2])
                per_page = 5
                
                riwayat = [o for o in reversed(db['orders_db']) if o['user_id'] == chat_id]
                total_pages = max(1, (len(riwayat) + per_page - 1) // per_page)
                
                start_idx = (page - 1) * per_page
                current_riwayat = riwayat[start_idx:start_idx + per_page]
                
                pesan = f"📜 *Riwayat Pesanan Kamu (Hal {page}/{total_pages}):*\\n\\n"
                if not current_riwayat:
                    pesan += "_Belum ada pesanan._"
                else:
                    for idx, o in enumerate(current_riwayat):
                        pesan += f"{start_idx + idx + 1}. {o['product_name']} (Rp {o['price']:,}) - {o['status']}\\n📅 {o['time']}\\n\\n"
                
                markup = InlineKeyboardMarkup(row_width=2)
                nav_buttons = []
                if page > 1:
                    nav_buttons.append(InlineKeyboardButton('⬅️ Prev', callback_data=f'usr_history_{page-1}'))
                if page < total_pages:
                    nav_buttons.append(InlineKeyboardButton('Next ➡️', callback_data=f'usr_history_{page+1}'))
                if nav_buttons:
                    markup.add(*nav_buttons)

                markup.add(InlineKeyboardButton('🔙 Kembali', callback_data='usr_back'))
                bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

            elif action == 'usr_caraorder':
                pesan = f"❓ *Cara Order di Toko Kami*\\n\\n{db['shop_info']['cara_order']}"
                markup = InlineKeyboardMarkup().add(InlineKeyboardButton('🔙 Kembali', callback_data='usr_back'))
                bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

            elif action == 'usr_info':
                pesan = (
                    "⚠️ *Informasi & Aturan Toko*\\n\\n"
                    f"📋 *Rules:*\\n{db['shop_info']['rules']}\\n\\n"
                    f"📞 *Admin:* {db['shop_info']['admin_contact']}\\n"
                    f"📢 *Channel:* {db['shop_info']['channel']}\\n\\n"
                    "_Terima kasih telah berlangganan!_"
                )
                markup = InlineKeyboardMarkup().add(InlineKeyboardButton('🔙 Kembali', callback_data='usr_back'))
                bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')
        except Exception as e:
            log_info(f"Error usr callback: {e}")

    @bot.callback_query_handler(func=lambda call: call.data.startswith('buy_'))
    def process_checkout(call):
        chat_id = call.message.chat.id
        if chat_id in db['banned_users']:
            return bot.answer_callback_query(call.id, "❌ Anda telah diblokir.", show_alert=True)
            
        now_ts = time.time()
        if chat_id in user_locks and (now_ts - user_locks[chat_id] < 3):
            return bot.answer_callback_query(call.id, "⏳ Tunggu sebentar sebelum menekan lagi.", show_alert=True)
        user_locks[chat_id] = now_ts
            
        pid = call.data.split('_')[1]
        
        with db_lock:
            produk = db['products_db'].get(pid)
            if not produk:
                return bot.answer_callback_query(call.id, "❌ Produk tidak ditemukan.", show_alert=True)
            if produk['stok'] <= 0:
                return bot.answer_callback_query(call.id, "❌ Maaf, stok habis.", show_alert=True)
                
            produk['stok'] -= 1
            now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
            db['orders_db'].append({
                "user_id": chat_id,
                "product_name": produk['nama'],
                "price": produk['harga'],
                "status": "Sukses",
                "time": now
            })
            commit()
        
        log_info(f"User {chat_id} berhasil membeli {produk['nama']}")
        pesan_sukses = (
            f"✅ *Pembelian Berhasil!*\\n\\n"
            f"Produk: {produk['nama']}\\n\\n"
            f"📦 *Informasi Akses:*\\n"
            f"Email: auto_{pid}_{chat_id}@store.id\\n"
            f"Pass: sukses123\\n\\n"
            f"_Terima kasih telah berbelanja!_"
        )
        bot.answer_callback_query(call.id, "Pembelian Berhasil!", show_alert=False)
        bot.send_message(chat_id, pesan_sukses, parse_mode='Markdown')
`
  },
  {
    name: 'handlers/admin.py',
    icon: <LayoutDashboard className="w-4 h-4 text-purple-400" />,
    language: 'python',
    code: `import os
import time
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton
from config import OWNER_PIN, log_info
from database import db, commit, db_lock, DB_FILE

owner_sessions = set()
pin_attempts = {}

def register_admin_handlers(bot):
    
    @bot.message_handler(commands=['admin'])
    def admin_login_start(message):
        chat_id = message.chat.id
        user_id = message.from_user.id
        
        if user_id in owner_sessions:
            show_admin_menu(bot, chat_id)
            return
            
        now = time.time()
        if user_id in pin_attempts:
            attempts, lockout_time = pin_attempts[user_id]
            if lockout_time and now < lockout_time:
                sisa_waktu = int(lockout_time - now)
                bot.send_message(chat_id, f"⏳ Terlalu banyak percobaan. Coba lagi dalam {sisa_waktu} detik.")
                return
            if lockout_time and now >= lockout_time:
                pin_attempts[user_id] = [0, 0]
                
        msg = bot.send_message(chat_id, "🔐 *Masukkan PIN Owner:*", parse_mode='Markdown')
        bot.register_next_step_handler(msg, process_pin_step)

    def process_pin_step(message):
        chat_id = message.chat.id
        user_id = message.from_user.id
        pin_input = message.text.strip()
        
        now = time.time()
        attempts, lockout_time = pin_attempts.get(user_id, [0, 0])
        
        if lockout_time and now < lockout_time:
            sisa_waktu = int(lockout_time - now)
            bot.send_message(chat_id, f"⏳ Coba lagi dalam {sisa_waktu} detik.")
            return

        if pin_input == OWNER_PIN:
            owner_sessions.add(user_id)
            pin_attempts[user_id] = [0, 0]
            bot.send_message(chat_id, "✅ *Login Berhasil*\\n\\nSelamat datang di Panel Administrator.", parse_mode='Markdown')
            show_admin_menu(bot, chat_id)
        else:
            attempts += 1
            if attempts >= 5:
                lockout_time = now + 300
                bot.send_message(chat_id, "❌ *Akses Diblokir!*\\nAnda telah gagal 5 kali. Silakan coba 5 menit lagi.", parse_mode='Markdown')
            else:
                bot.send_message(chat_id, f"❌ *PIN Salah!*\\nSisa percobaan: {5 - attempts}", parse_mode='Markdown')
            pin_attempts[user_id] = [attempts, lockout_time]

    def show_admin_menu(bot, chat_id, message_id=None):
        pesan = "👑 *PANEL ADMINISTRATOR*\\n\\nSemua kontrol 100% menggunakan tombol interaktif:"
        markup = InlineKeyboardMarkup(row_width=2)
        markup.add(
            InlineKeyboardButton('📦 Kelola Produk', callback_data='adm_produk'),
            InlineKeyboardButton('👥 Kelola User', callback_data='adm_user_1')
        )
        markup.add(
            InlineKeyboardButton('📋 Kelola Pesanan', callback_data='adm_pesanan_1'),
            InlineKeyboardButton('📢 Broadcast', callback_data='adm_broadcast')
        )
        markup.add(
            InlineKeyboardButton('📊 Statistik Toko', callback_data='adm_stats'),
            InlineKeyboardButton('⚙️ Pengaturan', callback_data='adm_setting')
        )
        markup.add(
            InlineKeyboardButton('📁 Backup Data', callback_data='adm_backup'),
            InlineKeyboardButton('🚫 Ban User', callback_data='adm_ban')
        )
        markup.add(
            InlineKeyboardButton('🚪 Logout Owner', callback_data='adm_logout'),
            InlineKeyboardButton('❌ Tutup Panel', callback_data='adm_close')
        )
        
        try:
            if message_id:
                bot.edit_message_text(pesan, chat_id, message_id, reply_markup=markup, parse_mode='Markdown')
            else:
                bot.send_message(chat_id, pesan, reply_markup=markup, parse_mode='Markdown')
        except Exception:
            pass

    @bot.callback_query_handler(func=lambda call: call.data.startswith('adm_'))
    def admin_callback_handler(call):
        try:
            chat_id = call.message.chat.id
            user_id = call.from_user.id
            if user_id not in owner_sessions:
                return bot.answer_callback_query(call.id, "❌ Sesi habis. Ketik /admin untuk login kembali.", show_alert=True)
                
            action = call.data
            
            if action == 'adm_logout':
                owner_sessions.discard(user_id)
                bot.answer_callback_query(call.id, "✅ Berhasil logout.", show_alert=True)
                try:
                    bot.delete_message(chat_id, call.message.message_id)
                except Exception:
                    bot.edit_message_text("🚪 *Anda telah logout.*", chat_id, call.message.message_id, parse_mode='Markdown')
                return
            elif action == 'adm_close':
                bot.delete_message(chat_id, call.message.message_id)
            elif action == 'adm_back':
                show_admin_menu(bot, chat_id, call.message.message_id)
                
            elif action == 'adm_stats':
                stok = sum(p['stok'] for p in db['products_db'].values())
                trx = len(db['orders_db'])
                uang = sum(o['price'] for o in db['orders_db'])
                pesan = f"📊 *Live Statistik Toko*\\n\\n👥 Total User: {len(db['users_db'])}\\n📦 Total Produk: {len(db['products_db'])} (Stok: {stok})\\n📋 Total Transaksi: {trx}\\n💵 Total Pendapatan: Rp {uang:,}"
                markup = InlineKeyboardMarkup().add(InlineKeyboardButton('🔙 Kembali', callback_data='adm_back'))
                bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

            # === PENGATURAN TOKO ===
            elif action == 'adm_setting':
                pesan = "⚙️ *Pengaturan Toko*"
                markup = InlineKeyboardMarkup(row_width=2)
                markup.add(
                    InlineKeyboardButton('🏪 Nama Toko', callback_data='adm_set_nama'),
                    InlineKeyboardButton('📢 Channel', callback_data='adm_set_channel')
                )
                markup.add(
                    InlineKeyboardButton('📖 Cara Order', callback_data='adm_caraorder'),
                    InlineKeyboardButton('⚠️ Info/Rules', callback_data='adm_set_rules')
                )
                markup.add(InlineKeyboardButton('🔙 Kembali', callback_data='adm_back'))
                bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')
                
            elif action.startswith('adm_set_'):
                bot.answer_callback_query(call.id, "Fitur input text akan diproses via message state.")
                
            elif action == 'adm_caraorder':
                pesan = f"📝 *Edit Cara Order*\\n\\n_Saat ini:_\\n{db['shop_info']['cara_order']}"
                markup = InlineKeyboardMarkup(row_width=1)
                markup.add(InlineKeyboardButton('🔄 Ubah ke Versi Pendek', callback_data='adm_caramin'))
                markup.add(InlineKeyboardButton('📜 Ubah ke Versi Detail', callback_data='adm_caramax'))
                markup.add(InlineKeyboardButton('🔙 Kembali', callback_data='adm_setting'))
                bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

            elif action == 'adm_caramin':
                with db_lock:
                    db['shop_info']['cara_order'] = "1. Pilih produk yg dimau.\\n2. Klik Beli & selesai!"
                    commit()
                bot.answer_callback_query(call.id, "Teks diperbarui!")
                log_info("Admin mengubah cara order (min)")
                call.data = 'adm_caraorder'
                return admin_callback_handler(call)
                
            elif action == 'adm_caramax':
                with db_lock:
                    db['shop_info']['cara_order'] = "1. Pilih menu List Produk.\\n2. Tekan Beli.\\n3. Produk akan diproses sistem."
                    commit()
                bot.answer_callback_query(call.id, "Teks diperbarui!")
                log_info("Admin mengubah cara order (max)")
                call.data = 'adm_caraorder'
                return admin_callback_handler(call)

            # === KATALOG & EDITOR PRODUK ===
            elif action == 'adm_produk':
                pesan = "📦 *Katalog Produk*\\nPilih produk untuk stok:"
                markup = InlineKeyboardMarkup(row_width=1)
                for pid, pdata in db['products_db'].items():
                    markup.add(InlineKeyboardButton(f"{pdata['nama']} (Rp {pdata['harga']:,} | Stok: {pdata['stok']})", callback_data=f"adm_ep_{pid}"))
                markup.row(InlineKeyboardButton('🔙 Kembali', callback_data='adm_back'))
                bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

            elif action.startswith('adm_ep_'):
                pid = action.split('_')[2]
                if pid not in db['products_db']:
                    return bot.answer_callback_query(call.id, "❌ Produk tidak ditemukan!", show_alert=True)
                    
                p = db['products_db'][pid]
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
                markup.add(InlineKeyboardButton('🔙 Kembali Katalog', callback_data='adm_produk'))
                bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

            elif action.startswith('adm_stk_'):
                pid = action.split('_')[2]
                delta = int(action.split('_')[3])
                with db_lock:
                    if pid in db['products_db']:
                        db['products_db'][pid]['stok'] = max(0, db['products_db'][pid]['stok'] + delta)
                        commit()
                call.data = f'adm_ep_{pid}'
                return admin_callback_handler(call)

            elif action.startswith('adm_hrg_'):
                pid = action.split('_')[2]
                delta = int(action.split('_')[3])
                with db_lock:
                    if pid in db['products_db']:
                        db['products_db'][pid]['harga'] = max(0, db['products_db'][pid]['harga'] + delta)
                        commit()
                call.data = f'adm_ep_{pid}'
                return admin_callback_handler(call)

            # === KELOLA USER (PAGINATION) ===
            elif action.startswith('adm_user_'):
                page = int(action.split('_')[2])
                per_page = 15
                users = db['users_db']
                total_pages = max(1, (len(users) + per_page - 1) // per_page)
                
                start_idx = (page - 1) * per_page
                current_users = users[start_idx:start_idx + per_page]
                
                pesan = f"👥 *Daftar User Aktif (Hal {page}/{total_pages})*\\n\\nTotal: {len(users)} user\\n\\n"
                for u in current_users:
                    pesan += f"👤 ID: \`{u}\`\\n"
                    
                markup = InlineKeyboardMarkup(row_width=2)
                nav_buttons = []
                if page > 1:
                    nav_buttons.append(InlineKeyboardButton('⬅️ Prev', callback_data=f'adm_user_{page-1}'))
                if page < total_pages:
                    nav_buttons.append(InlineKeyboardButton('Next ➡️', callback_data=f'adm_user_{page+1}'))
                if nav_buttons:
                    markup.add(*nav_buttons)
                    
                markup.add(InlineKeyboardButton('🔙 Kembali', callback_data='adm_back'))
                bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')
                
            # === KELOLA PESANAN (PAGINATION) ===
            elif action.startswith('adm_pesanan_'):
                page = int(action.split('_')[2])
                per_page = 5
                
                orders = list(reversed(db['orders_db']))
                total_pages = max(1, (len(orders) + per_page - 1) // per_page)
                
                start_idx = (page - 1) * per_page
                current_orders = orders[start_idx:start_idx + per_page]
                
                pesan = f"📋 *Data Pesanan Terakhir (Hal {page}/{total_pages})*\\n\\n"
                if not current_orders:
                    pesan += "_Belum ada pesanan._"
                else:
                    for o in current_orders:
                        pesan += f"🔹 *{o['product_name']}*\\nUser: \`{o['user_id']}\` | Status: {o['status']}\\n📅 {o['time']}\\n\\n"
                
                markup = InlineKeyboardMarkup(row_width=2)
                nav_buttons = []
                if page > 1:
                    nav_buttons.append(InlineKeyboardButton('⬅️ Prev', callback_data=f'adm_pesanan_{page-1}'))
                if page < total_pages:
                    nav_buttons.append(InlineKeyboardButton('Next ➡️', callback_data=f'adm_pesanan_{page+1}'))
                if nav_buttons:
                    markup.add(*nav_buttons)
                    
                markup.add(InlineKeyboardButton('🔙 Kembali', callback_data='adm_back'))
                bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

            # === BROADCAST ===
            elif action == 'adm_broadcast':
                markup = InlineKeyboardMarkup(row_width=1)
                markup.add(
                    InlineKeyboardButton('📨 Broadcast Teks Info', callback_data='adm_bc_all'),
                    InlineKeyboardButton('🔙 Kembali', callback_data='adm_back')
                )
                bot.edit_message_text("📢 *Pilih Target Broadcast*", chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')
                
            elif action == 'adm_bc_all':
                bot.answer_callback_query(call.id, "Fitur Broadcast via state message.")
                log_info(f"Admin request broadcast ke {len(db['users_db'])} users.")

            # === BACKUP DATA ===
            elif action == 'adm_backup':
                if os.path.exists(DB_FILE):
                    try:
                        with open(DB_FILE, 'rb') as f:
                            bot.send_document(chat_id, f, caption="📁 *Backup Database JSON berhasil!*", parse_mode='Markdown')
                        bot.answer_callback_query(call.id, "Backup dikirim via dokumen!")
                        log_info("Admin mendownload backup database.")
                    except Exception as e:
                        bot.answer_callback_query(call.id, f"Gagal: {e}", show_alert=True)
                else:
                    bot.answer_callback_query(call.id, "File database belum ada.", show_alert=True)
                
            # === BAN USER ===
            elif action == 'adm_ban':
                pesan = "🚫 *Manajemen Ban User*\\n\\nDaftar user yang diblokir:\\n"
                if not db['banned_users']:
                    pesan += "_Tidak ada_"
                for b in db['banned_users']:
                    pesan += f"• ID: \`{b}\`\\n"
                markup = InlineKeyboardMarkup().add(InlineKeyboardButton('🔙 Kembali', callback_data='adm_back'))
                bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')
        except Exception as e:
            log_info(f"Error admin cb: {e}")
`
  },
  {
    name: '.env',
    icon: <File className="w-4 h-4 text-emerald-400" />,
    language: 'env',
    code: `API_TOKEN=YOUR_BOT_TOKEN_HERE
OWNER_PIN=123456
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
