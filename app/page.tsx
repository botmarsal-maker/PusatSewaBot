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

vouchers_db = {
    "WELCOME50": {"potongan": 50000},
    "PROMO10K": {"potongan": 10000}
}

shop_info = {
    "store_name": "Toko Bot Digital",
    "rekening": "BCA 123456789 a.n. Toko Bot",
    "ewallet": "OVO/Dana: 081234567890",
    "admin_contact": "@admin_toko",
    "channel": "https://t.me/channel_toko",
    "rules": "1. Barang yang dibeli tidak bisa dikembalikan.\\n2. Proses pengiriman berjalan 24 Jam.",
    "cara_order": "1. Pilih menu *List Produk*.\\n2. Tekan tombol keranjang/beli pada produk incaran.\\n3. Pastikan saldo tercukupi. (Jika kurang, lakukan Deposit).\\n4. Produk akan dikirim langsung berupa info akun/kode.\\n5. Proses otomatis 24 Jam Non-Stop."
}

user_balances = {} 
users_db = set()
user_deposits = {}
orders_db = []
banned_users = set()
`
  },
  {
    name: 'handlers/user.py',
    icon: <FileCode2 className="w-4 h-4 text-indigo-400" />,
    language: 'python',
    code: `from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton
import datetime
from database import products_db, user_balances, users_db, vouchers_db, shop_info, user_deposits, orders_db, banned_users

def register_user_handlers(bot):
    
    @bot.message_handler(commands=['start'])
    def send_welcome(message):
        chat_id = message.chat.id
        if chat_id in banned_users:
            return bot.send_message(chat_id, "❌ Anda telah diblokir dari bot ini.")
            
        users_db.add(chat_id)
        
        # Hadiah awal (dummy logic)
        if chat_id not in user_balances:
            user_balances[chat_id] = 50000
        
        saldo = user_balances[chat_id]
        
        markup = InlineKeyboardMarkup(row_width=2)
        markup.add(
            InlineKeyboardButton('📦 List Produk', callback_data='usr_produk'),
            InlineKeyboardButton('🎫 Voucher', callback_data='usr_voucher')
        )
        markup.add(
            InlineKeyboardButton('💳 Deposit', callback_data='usr_deposit'),
            InlineKeyboardButton('📜 Riwayat Pesanan', callback_data='usr_history')
        )
        markup.add(
            InlineKeyboardButton('💰 Saldo Saya', callback_data='usr_saldo'),
            InlineKeyboardButton('❓ Cara Order', callback_data='usr_caraorder')
        )
        markup.add(
            InlineKeyboardButton('⚠️ Information', callback_data='usr_info')
        )
        
        pesan = f"Halo selamat datang di *{shop_info.get('store_name', 'Toko Bot Digital')}*! 👋\\n\\nID Kamu: {chat_id}\\nSaldo: Rp {saldo:,}\\n\\nPilih menu di bawah:"
        bot.send_message(chat_id, pesan, reply_markup=markup, parse_mode='Markdown')

    @bot.callback_query_handler(func=lambda call: call.data.startswith('usr_'))
    def user_menu_handler(call):
        chat_id = call.message.chat.id
        if chat_id in banned_users:
            return bot.answer_callback_query(call.id, "❌ Anda telah diblokir.", show_alert=True)
            
        action = call.data
        
        if action == 'usr_back':
            saldo = user_balances.get(chat_id, 0)
            markup = InlineKeyboardMarkup(row_width=2)
            markup.add(
                InlineKeyboardButton('📦 List Produk', callback_data='usr_produk'),
                InlineKeyboardButton('🎫 Voucher', callback_data='usr_voucher')
            )
            markup.add(
                InlineKeyboardButton('💳 Deposit', callback_data='usr_deposit'),
                InlineKeyboardButton('📜 Riwayat Pesanan', callback_data='usr_history')
            )
            markup.add(
                InlineKeyboardButton('💰 Saldo Saya', callback_data='usr_saldo'),
                InlineKeyboardButton('❓ Cara Order', callback_data='usr_caraorder')
            )
            markup.add(
                InlineKeyboardButton('⚠️ Information', callback_data='usr_info')
            )
            pesan = f"Halo selamat datang di *{shop_info.get('store_name', 'Toko Bot Digital')}*! 👋\\n\\nID Kamu: {chat_id}\\nSaldo: Rp {saldo:,}\\n\\nPilih menu di bawah:"
            bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

        elif action == 'usr_produk':
            pesan = "📦 *Daftar Produk Digital Kami:*\\n\\n"
            markup = InlineKeyboardMarkup(row_width=1)
            for pid, pdata in products_db.items():
                pesan += f"[{pid}] {pdata['nama']}\\nHarga: Rp {pdata['harga']:,} | Stok: {pdata['stok']}\\n\\n"
                markup.add(InlineKeyboardButton(f"🛒 Beli {pdata['nama']}", callback_data=f"buy_{pid}"))
            markup.add(InlineKeyboardButton('🔙 Kembali', callback_data='usr_back'))
            bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

        elif action == 'usr_voucher':
            pesan = "🛍 *Katalog Voucher Terdaftar:*\\n\\n"
            if not vouchers_db:
                pesan += "_Belum ada voucher aktif._"
            for kode, vdata in vouchers_db.items():
                pesan += f"🎫 Kode: *{kode}*\\nPotongan Harga: Rp {vdata['potongan']:,}\\n\\n"
            markup = InlineKeyboardMarkup().add(InlineKeyboardButton('🔙 Kembali', callback_data='usr_back'))
            bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

        elif action == 'usr_history':
            riwayat = [o for o in orders_db if o['user_id'] == chat_id]
            pesan = "📜 *Riwayat Pesanan Kamu:*\\n\\n"
            if not riwayat:
                pesan += "_Belum ada pesanan._"
            for idx, o in enumerate(riwayat[-5:]):
                pesan += f"{idx+1}. {o['product_name']} (Rp {o['price']:,}) - {o['status']}\\n"
            markup = InlineKeyboardMarkup().add(InlineKeyboardButton('🔙 Kembali', callback_data='usr_back'))
            bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

        elif action == 'usr_saldo':
            saldo = user_balances.get(chat_id, 0)
            pesan = f"💰 *Informasi Saldo*\\n\\nID User: {chat_id}\\nSaldo Aktif: *Rp {saldo:,}*\\n\\nUntuk menambah saldo, silakan pilih menu Deposit."
            markup = InlineKeyboardMarkup().add(
                InlineKeyboardButton('💳 Deposit Sekarang', callback_data='usr_deposit'),
                InlineKeyboardButton('🔙 Kembali', callback_data='usr_back')
            )
            bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

        elif action == 'usr_deposit':
            saldo = user_balances.get(chat_id, 0)
            pesan = (
                f"💰 *Instruksi Deposit*\\n\\n"
                f"💳 Saldo Anda: *Rp {saldo:,}*\\n\\n"
                f"Silakan transfer ke:\\n"
                f"🏦 Bank: {shop_info['rekening']}\\n"
                f"📱 E-Wallet: {shop_info['ewallet']}\\n\\n"
            )
            
            riwayat = user_deposits.get(chat_id, [])
            if riwayat:
                pesan += "📜 *Riwayat Deposit Terakhir:*\\n"
                for idx, d in enumerate(riwayat[-3:]):
                    pesan += f"{idx+1}. Rp {d['nominal']:,} ({d['status']})\\n"
                pesan += "\\n"
                
            pesan += "Jika sudah transfer, konfirmasi ke Admin."
            
            temp_admin = shop_info['admin_contact'].replace('@', '')
            markup = InlineKeyboardMarkup().add(
                InlineKeyboardButton('💬 Konfirmasi ke Admin', url=f"https://t.me/{temp_admin}"),
                InlineKeyboardButton('🔙 Kembali', callback_data='usr_back')
            )
            bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

        elif action == 'usr_caraorder':
            pesan = f"❓ *Cara Order di Toko Kami*\\n\\n{shop_info['cara_order']}"
            markup = InlineKeyboardMarkup().add(InlineKeyboardButton('🔙 Kembali', callback_data='usr_back'))
            bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

        elif action == 'usr_info':
            pesan = (
                "⚠️ *Informasi & Aturan Toko*\\n\\n"
                f"📋 *Rules:*\\n{shop_info['rules']}\\n\\n"
                f"📞 *Admin:* {shop_info['admin_contact']}\\n"
                f"📢 *Channel:* {shop_info['channel']}\\n\\n"
                "_Terima kasih telah berlangganan!_"
            )
            markup = InlineKeyboardMarkup().add(InlineKeyboardButton('🔙 Kembali', callback_data='usr_back'))
            bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

    @bot.callback_query_handler(func=lambda call: call.data.startswith('buy_'))
    def process_checkout(call):
        chat_id = call.message.chat.id
        if chat_id in banned_users:
            return bot.answer_callback_query(call.id, "❌ Anda telah diblokir.", show_alert=True)
            
        pid = call.data.split('_')[1]
        
        if chat_id not in user_balances:
            return bot.answer_callback_query(call.id, "Sesi habis, kirim /start", show_alert=True)
            
        produk = products_db.get(pid)
        if not produk:
            return bot.answer_callback_query(call.id, "Produk sudah dihapus", show_alert=True)
        
        if produk['stok'] <= 0:
            return bot.answer_callback_query(call.id, "Maaf, stok habis.", show_alert=True)
            
        if user_balances[chat_id] < produk['harga']:
            return bot.answer_callback_query(call.id, "Saldo tidak cukup, silakan Deposit.", show_alert=True)
            
        # Eksekusi Pembelian
        user_balances[chat_id] -= produk['harga']
        products_db[pid]['stok'] -= 1
        
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        orders_db.append({
            "user_id": chat_id,
            "product_name": produk['nama'],
            "price": produk['harga'],
            "status": "Sukses",
            "time": now
        })
        
        pesan_sukses = (
            f"✅ *Pembelian Berhasil!*\\n\\n"
            f"Produk: {produk['nama']}\\n"
            f"Sisa Saldo: Rp {user_balances[chat_id]:,}\\n\\n"
            f"📦 *Informasi Akses:*\\n"
            f"Email: auto{pid}_{chat_id}@store.id\\n"
            f"Pass: auto_sukses"
        )
        bot.answer_callback_query(call.id, "Pembelian Berhasil!")
        bot.send_message(chat_id, pesan_sukses, parse_mode='Markdown')
`
  },
  {
    name: 'handlers/admin.py',
    icon: <LayoutDashboard className="w-4 h-4 text-purple-400" />,
    language: 'python',
    code: `from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton
from config import ADMIN_USERNAME
from database import products_db, user_balances, users_db, vouchers_db, shop_info, user_deposits, orders_db, banned_users

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
            InlineKeyboardButton('📦 Kelola Produk', callback_data='adm_produk'),
            InlineKeyboardButton('👥 Kelola User', callback_data='adm_user')
        )
        markup.add(
            InlineKeyboardButton('💰 Kelola Saldo', callback_data='adm_saldo'),
            InlineKeyboardButton('🎫 Kelola Voucher', callback_data='adm_voucher')
        )
        markup.add(
            InlineKeyboardButton('📋 Kelola Pesanan', callback_data='adm_pesanan'),
            InlineKeyboardButton('💳 Kelola Deposit', callback_data='adm_deposit')
        )
        markup.add(
            InlineKeyboardButton('📢 Broadcast', callback_data='adm_broadcast'),
            InlineKeyboardButton('📊 Statistik Toko', callback_data='adm_stats')
        )
        markup.add(
            InlineKeyboardButton('⚙️ Pengaturan', callback_data='adm_setting'),
            InlineKeyboardButton('📁 Backup Data', callback_data='adm_backup')
        )
        markup.add(
            InlineKeyboardButton('🚫 Ban User', callback_data='adm_ban'),
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
            trx = len(orders_db)
            dep = sum(len(d) for d in user_deposits.values())
            pesan = f"📊 *Live Statistik Toko*\\n\\n👥 Total User: {len(users_db)}\\n📦 Total Produk: {len(products_db)} (Stok: {stok})\\n💵 Uang Beredar: Rp {uang:,}\\n📋 Total Transaksi: {trx}\\n💳 Total Deposit: {dep}"
            markup = InlineKeyboardMarkup().add(InlineKeyboardButton('🔙 Kembali', callback_data='adm_back'))
            bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

        # === KELOLA VOUCHER ===
        elif action == 'adm_voucher':
            pesan = "🎫 *Kelola Voucher*\\nPilih voucher untuk dihapus:"
            markup = InlineKeyboardMarkup(row_width=1)
            for kode, vdata in vouchers_db.items():
                markup.add(InlineKeyboardButton(f"❌ {kode} (Rp {vdata['potongan']:,})", callback_data=f"adm_delv_{kode}"))
            markup.row(
                InlineKeyboardButton('➕ Tambah Dummy', callback_data='adm_addv'),
                InlineKeyboardButton('🔙 Kembali', callback_data='adm_back')
            )
            bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

        elif action.startswith('adm_delv_'):
            kode = action.split('_')[2]
            if kode in vouchers_db:
                del vouchers_db[kode]
            call.data = 'adm_voucher'
            return admin_callback_handler(call)
            
        elif action == 'adm_addv':
            import random
            kode = f"PROMO{random.randint(10,99)}"
            vouchers_db[kode] = {"potongan": random.choice([5000, 10000, 15000])}
            call.data = 'adm_voucher'
            return admin_callback_handler(call)

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
            bot.answer_callback_query(call.id, "Fitur text editing segera tersedia.")
            
        elif action == 'adm_caraorder':
            pesan = f"📝 *Edit Cara Order*\\n\\n_Saat ini:_\\n{shop_info['cara_order']}"
            markup = InlineKeyboardMarkup(row_width=1)
            markup.add(InlineKeyboardButton('🔄 Ubah ke Versi Pendek', callback_data='adm_caramin'))
            markup.add(InlineKeyboardButton('📜 Ubah ke Versi Detail', callback_data='adm_caramax'))
            markup.add(InlineKeyboardButton('🔙 Kembali', callback_data='adm_setting'))
            bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

        elif action == 'adm_caramin':
            shop_info['cara_order'] = "1. Pilih produk yg dimau.\\n2. Klik Beli & selesai!"
            bot.answer_callback_query(call.id, "Teks diperbarui!")
            call.data = 'adm_caraorder'
            return admin_callback_handler(call)
            
        elif action == 'adm_caramax':
            shop_info['cara_order'] = "1. Pilih menu List Produk.\\n2. Tekan Beli.\\n3. Pastikan saldo cukup.\\n4. Produk dikirim 24 Jam."
            bot.answer_callback_query(call.id, "Teks diperbarui!")
            call.data = 'adm_caraorder'
            return admin_callback_handler(call)

        # === KATALOG & EDITOR PRODUK ===
        elif action == 'adm_produk':
            pesan = "📦 *Katalog Produk*\\nPilih produk untuk stok:"
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
                call.data = f'adm_ep_{pid}'
                return admin_callback_handler(call)

        elif action.startswith('adm_hrg_'):
            pid = action.split('_')[2]
            delta = int(action.split('_')[3])
            if pid in products_db:
                products_db[pid]['harga'] = max(0, products_db[pid]['harga'] + delta)
                call.data = f'adm_ep_{pid}'
                return admin_callback_handler(call)

        # === KELOLA SALDO USER ===
        elif action == 'adm_saldo':
            pesan = "💰 *Pilih Pengguna yang Mau Disetel:*"
            markup = InlineKeyboardMarkup(row_width=1)
            if not users_db:
                pesan = "⚠️ *Belum ada pengguna.*"
            else:
                for uid in users_db:
                    saldo = user_balances.get(uid, 0)
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
            user_balances[uid] = max(0, user_balances.get(uid, 0) + delta)
            if delta > 0:
                if uid not in user_deposits:
                    user_deposits[uid] = []
                import datetime
                user_deposits[uid].append({"nominal": delta, "status": "Sukses Ditambahkan Admin"})
                try:
                    bot.send_message(uid, f"💰 *Deposit Masuk* (Rp {delta:,}) ditambahkan oleh Admin!", parse_mode='Markdown')
                except: pass
            call.data = f'adm_usr_{uid}'
            return admin_callback_handler(call)
            
        # === KELOLA USER ===
        elif action == 'adm_user':
            pesan = "👥 *Kelola User*"
            markup = InlineKeyboardMarkup(row_width=2)
            markup.add(
                InlineKeyboardButton('📋 Daftar User', callback_data='adm_ulist'),
                InlineKeyboardButton('🔎 Cari User', callback_data='adm_usearch')
            )
            markup.add(InlineKeyboardButton('🔙 Kembali', callback_data='adm_back'))
            bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')
            
        elif action == 'adm_ulist':
            pesan = f"📋 *Daftar User Aktif ({len(users_db)})*\\n\\n"
            for u in list(users_db)[:20]:
                pesan += f"👤 ID: {u} (Saldo: Rp {user_balances.get(u,0):,})\\n"
            if len(users_db) > 20:
                 pesan += "\\n_...dan lainnya (Batas max 20 tampil)_"
            markup = InlineKeyboardMarkup().add(InlineKeyboardButton('🔙 Kembali', callback_data='adm_user'))
            bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')
            
        elif action == 'adm_usearch':
            bot.answer_callback_query(call.id, "Fitur cari user aktif!")
            
        # === KELOLA PESANAN ===
        elif action == 'adm_pesanan':
            pesan = "📋 *Data Pesanan Terakhir*"
            markup = InlineKeyboardMarkup(row_width=1)
            for idx, o in enumerate(orders_db[-5:]):
                markup.add(InlineKeyboardButton(f"[{o['status']}] ID {o['user_id']} beli {o['product_name']}", callback_data="none"))
            markup.add(InlineKeyboardButton('🔙 Kembali', callback_data='adm_back'))
            bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')

        # === KELOLA DEPOSIT ===
        elif action == 'adm_deposit':
            pesan = "💳 *Antrean Deposit Terbaru*\\n*(Mock - Data dari Histori User)*\\n\\n"
            for uid, deps in user_deposits.items():
                if deps:
                    ld = deps[-1]
                    pesan += f"ID: {uid} -> Rp {ld['nominal']:,} ({ld['status']})\\n"
            markup = InlineKeyboardMarkup().add(InlineKeyboardButton('🔙 Kembali', callback_data='adm_back'))
            bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')
            
        # === BROADCAST ===
        elif action == 'adm_broadcast':
            markup = InlineKeyboardMarkup(row_width=1)
            markup.add(
                InlineKeyboardButton('📨 Broadcast Semua User', callback_data='adm_bc_all'),
                InlineKeyboardButton('🔙 Kembali', callback_data='adm_back')
            )
            bot.edit_message_text("📢 *Pilih Target Broadcast*", chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')
            
        elif action == 'adm_bc_all':
            bot.answer_callback_query(call.id, "Fitur Broadcast siap dijalankan!")

        # === BACKUP DATA ===
        elif action == 'adm_backup':
            bot.answer_callback_query(call.id, "Database berhasil di-backup!")
            
        # === BAN USER ===
        elif action == 'adm_ban':
            pesan = "🚫 *Manajemen Ban User*\\n\\nDaftar user yang diblokir:\\n"
            if not banned_users:
                pesan += "_Tidak ada_"
            for b in banned_users:
                pesan += f"• ID: {b}\\n"
            markup = InlineKeyboardMarkup().add(InlineKeyboardButton('🔙 Kembali', callback_data='adm_back'))
            bot.edit_message_text(pesan, chat_id, call.message.message_id, reply_markup=markup, parse_mode='Markdown')
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
