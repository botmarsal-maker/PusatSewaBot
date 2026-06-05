import telebot
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
        f"Halo selamat datang di Bot Store Digital! 👋\n"
        f"ID Kamu: {chat_id}\n"
        f"Saldo saat ini: Rp {saldo:,}\n\n"
        f"Silakan pilih menu di bawah ini untuk memulai layanan."
    )
    
    bot.send_message(chat_id, pesan, reply_markup=markup)

# 3. Fitur List Produk (InlineKeyboardMarkup)
@bot.message_handler(func=lambda message: message.text == '🏷 List Produk')
def list_produk(message):
    chat_id = message.chat.id
    
    pesan = "Daftar Produk Digital Kami:\n\n"
    for pid, pdata in products_db.items():
        pesan += f"[{pid}] {pdata['nama']}\n"
        pesan += f"Harga: Rp {pdata['harga']:,} | Stok: {pdata['stok']}\n\n"
        
    pesan += "Kirim teks atau tekan tombol angka 1, 2, atau 3 untuk langsung membeli."
    
    # Tombol Transparan (InlineKeyboardMarkup)
    inline_markup = InlineKeyboardMarkup()
    btn_next = InlineKeyboardButton('➡️ Selanjutnya', callback_data='next')
    btn_populer = InlineKeyboardButton('🔥 PRODUK POPULER', callback_data='populer')
    inline_markup.row(btn_next, btn_populer)
    
    bot.send_message(chat_id, pesan, reply_markup=inline_markup)

# Handler untuk tombol transparant / Inline Keyboard
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
        bot.send_message(chat_id, f"❌ Gagal: Saldo kamu (Rp {saldo:,}) tidak cukup untuk membeli {nama_produk} seharga Rp {harga:,}.\nSilakan lakukan Deposit.")
        return
        
    # Eksekusi Pembelian
    users_db[chat_id] -= harga
    products_db[product_id]["stok"] -= 1
    
    sisa_saldo = users_db[chat_id]
    
    # Pesan sukses beserta detail akun dummy
    pesan_sukses = (
        f"✅ Pembelian Berhasil!\n\n"
        f"Produk: {nama_produk}\n"
        f"Harga: Rp {harga:,}\n"
        f"Sisa Saldo: Rp {sisa_saldo:,}\n\n"
        f"📦 Detail Akun:\n"
        f"Email: dummy{product_id}_{chat_id}@email.com\n"
        f"Pass: pass{product_id}123\n\n"
        f"Terima kasih telah berbelanja!"
    )
    
    bot.send_message(chat_id, pesan_sukses)

# Handler untuk menu lain yang belum diimplementasikan
@bot.message_handler(func=lambda message: message.text in ['🛍 Voucher', '📁 Laporan Stok', '💰 Deposit', '❓ Cara Order', '⚠️ Information'])
def handle_other_menu(message):
    bot.send_message(message.chat.id, f"Anda memilih menu: {message.text}.\nFitur ini sedang dalam pengembangan 🛠️.")

# ==========================================
# KODE TAMBAHAN: FITUR PANEL ADMIN (DAPUR TOKO)
# ==========================================

# 1. Variabel Admin
ADMIN_USERNAME = "username_saya_disini" # Ganti tanpa awalan '@'

# 2. Perintah /loginowner
@bot.message_handler(commands=['loginowner'])
def login_owner(message):
    chat_id = message.chat.id
    username = message.from_user.username
    
    # Validasi Username Telegram
    if username != ADMIN_USERNAME:
        bot.send_message(chat_id, "❌ Akses Ditolak!")
        return
        
    pesan = "Selamat datang di Panel Admin! 👨‍💻\nSilakan pilih menu pengaturan toko:"
    
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
        panduan = "Untuk update stok produk, ketik perintah:\n`/updatestok [id_produk] [jumlah_baru]`\nContoh: `/updatestok 1 20`"
        bot.send_message(chat_id, panduan, parse_mode='Markdown')
    elif call.data == 'admin_bayar':
        bot.send_message(chat_id, "ℹ️ Panduan: Ketik /aturpembayaran [metode] [nomor_rekening]")
    elif call.data == 'admin_saldo':
        panduan = "Untuk tambah saldo user, ketik perintah:\n`/tambahsaldo [chat_id] [jumlah]`\nContoh: `/tambahsaldo 1234567 50000`"
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
            bot.send_message(chat_id, "❌ Format salah!\nGunakan: /updatestok [id_produk] [jumlah_baru]")
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
        
        bot.send_message(chat_id, f"✅ Stok berhasil diupdate!\n\n📦 Produk: {nama_produk}\n📊 Stok Baru: {jumlah_baru}")
        
    except ValueError:
        bot.send_message(chat_id, "❌ Jumlah stok harus berupa angka!")
    except Exception as e:
        bot.send_message(chat_id, f"❌ Terjadi kesalahan system: {str(e)}")

# Menjalankan bot (loop terus menerus)
if __name__ == "__main__":
    print("Bot sedang berjalan...")
    bot.polling(none_stop=True)
