import re

with open("app/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Separate the top part, the files array, and the bottom part
match = re.search(r'(const files = \[)(.*?)(\];\n\nexport default function WorkspacePage)', content, flags=re.DOTALL)
if not match:
    print("Could not find files array")
    exit(1)

prefix = content[:match.start(1)]
suffix = content[match.end(2):]

files_code = """const files = [
  {
    name: 'main.py',
    icon: <Play className="w-4 h-4 text-green-400" />,
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
try:
    ADMIN_ID = int(os.getenv('ADMIN_ID', 0))
except ValueError:
    ADMIN_ID = 0

if not API_TOKEN:
    raise ValueError("API_TOKEN tidak ditemukan.")
if not ADMIN_ID:
    raise ValueError("ADMIN_ID tidak ditemukan. Set ADMIN_ID di .env menggunakan Telegram ID.")

logging.basicConfig(
    filename='app.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def log_info(message):
    logging.info(message)
    print(message)
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
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton
from config import ADMIN_ID, log_info
from database import db, commit, db_lock, DB_FILE

def register_admin_handlers(bot):
    
    @bot.message_handler(commands=['admin'])
    def admin_dashboard(message):
        if message.from_user.id != ADMIN_ID:
            return bot.send_message(message.chat.id, "❌ Akses Ditolak!", parse_mode='Markdown')
        show_admin_menu(bot, message.chat.id)

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
        markup.add(InlineKeyboardButton('❌ Tutup Panel', callback_data='adm_close'))
        
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
            if call.from_user.id != ADMIN_ID:
                return bot.answer_callback_query(call.id, "❌ Akses Ditolak!", show_alert=True)
                
            action = call.data
            
            if action == 'adm_close':
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
ADMIN_ID=123456789
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
];"""

with open("app/page.tsx", "w", encoding="utf-8") as f:
    f.write(prefix + files_code + suffix)
    
print("Successfully regenerated app/page.tsx!")
