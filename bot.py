import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton
import time
from datetime import datetime
import random
import string
import database as db
from config import BOT_TOKEN, ADMIN_ID, BANK_NAME, NOREK, ATAS_NAMA

# Inisialisasi Bot & Database
bot = telebot.TeleBot(BOT_TOKEN)
db.init_db()

# State Management / Memory untuk interaktif input (qty, add product, dll)
user_states = {}

def set_state(chat_id, state, data=None):
    user_states[chat_id] = {'state': state, 'data': data or {}}

def get_state(chat_id):
    return user_states.get(chat_id, {'state': None, 'data': {}})

def clear_state(chat_id):
    if chat_id in user_states:
        del user_states[chat_id]

def format_rupiah(angka):
    return f"Rp {int(angka):,}".replace(",", ".")

def generate_invoice_id():
    return "INV" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

# ==========================================
# BAGIAN USER
# ==========================================

def get_main_keyboard():
    markup = ReplyKeyboardMarkup(resize_keyboard=True, row_width=3)
    markup.row(
        KeyboardButton("🏷 List Produk"),
        KeyboardButton("🛍 Voucher"),
        KeyboardButton("📁 Laporan Stok")
    )
    # Add numbers 1 to 19 like the screenshot
    buttons = [KeyboardButton(str(i)) for i in range(1, 20)]
    
    # Add them in chunks of 5 (1-5, 6-10, etc)
    for i in range(0, len(buttons), 5):
        markup.add(*buttons[i:i+5])
    return markup

@bot.message_handler(commands=['start'])
def send_welcome(message):
    chat_id = message.chat.id
    db.add_user(chat_id, message.chat.username)
    clear_state(chat_id)
    
    bot.send_message(chat_id, "✅ Data berhasil dimuat!", reply_markup=get_main_keyboard())
    show_products(chat_id, message_id=None, page=1)

@bot.message_handler(func=lambda message: message.text in ["🏷 List Produk", "🛍 Voucher", "📁 Laporan Stok"] or message.text.isdigit())
def handle_menu_text(message):
    chat_id = message.chat.id
    text = message.text
    
    if text == "🏷 List Produk":
        show_products(chat_id, message_id=None, page=1)
    elif text == "🛍 Voucher":
        bot.send_message(chat_id, "Fitur ini sedang dalam pengembangan 🛠.")
    elif text == "📁 Laporan Stok":
        bot.send_message(chat_id, "Fitur ini sedang dalam pengembangan 🛠.")
    elif text.isdigit():
        # Handle product selection via number
        prod_index = int(text)
        products = db.get_all_products()
        if 1 <= prod_index <= len(products):
            # Select the product at index - 1 (since 1-based indexing)
            p = products[prod_index - 1]
            send_product_detail(chat_id, p['id'])
        else:
            bot.send_message(chat_id, f"Produk nomor {prod_index} tidak ditemukan.")

@bot.callback_query_handler(func=lambda call: call.data.startswith('user_'))
def handle_user_callbacks(call):
    chat_id = call.message.chat.id
    data = call.data
    
    if data == "user_list_products":
        show_products(chat_id, call.message.message_id, page=1)
        
    elif data == "user_popular":
        bot.answer_callback_query(call.id, "Fitur rekomendasi produk populer segera hadir!", show_alert=True)
              
    elif data == "user_history":
        orders = db.get_user_orders(chat_id)
        if not orders:
            text = "Belum ada transaksi di akun Anda."
        else:
            text = "🧾 *Riwayat Transaksi (10 Terakhir):*\n\n"
            for o in orders:
                prod = db.get_product(o['product_id'])
                p_name = prod['name'] if prod else "Unknown"
                text += f"▪️ *{o['invoice_id']}* | {p_name} (x{o['qty']})\n" \
                        f"   Status: `{o['status'].upper()}` | {format_rupiah(o['total_price'])}\n\n"
        bot.edit_message_text(text, chat_id, call.message.message_id, parse_mode='Markdown')

def show_products(chat_id, message_id=None, page=1):
    items_per_page = 10
    products = db.get_all_products()
    total_pages = max(1, (len(products) + items_per_page - 1) // items_per_page)
    
    if not products:
        if message_id:
            bot.edit_message_text("Saat ini belum ada produk yang tersedia.", chat_id, message_id)
        else:
            bot.send_message(chat_id, "Saat ini belum ada produk yang tersedia.")
        return

    start_idx = (page - 1) * items_per_page
    end_idx = start_idx + items_per_page
    current_products = products[start_idx:end_idx]

    text = "LIST PRODUCT\n\n"
    
    for i, p in enumerate(current_products, start=start_idx + 1):
        stok = db.get_stock_count(p['id'])
        text += f"[{i}]. {p['name'].upper()} ( {stok} )\n"
        
    current_time = datetime.now().strftime("%I:%M:%S %p")
    text += f"\n📄 Halaman {page} / {total_pages}\n"
    text += f"📅 {current_time}"

    markup = InlineKeyboardMarkup(row_width=1)
    
    # Navigasi Pagination
    nav_buttons = []
    if page > 1:
        nav_buttons.append(InlineKeyboardButton("⬅️ Sebelumnya", callback_data=f"page_{page-1}"))
    if page < total_pages:
        nav_buttons.append(InlineKeyboardButton("➡️ Selanjutnya", callback_data=f"page_{page+1}"))
    if nav_buttons:
        markup.row(*nav_buttons)
        
    markup.add(InlineKeyboardButton("🔥 PRODUK POPULER", callback_data="user_popular"))
    
    if message_id:
        bot.edit_message_text(text, chat_id, message_id, reply_markup=markup)
    else:
        bot.send_message(chat_id, text, reply_markup=markup)

@bot.callback_query_handler(func=lambda call: call.data.startswith('page_'))
def handle_pagination(call):
    page = int(call.data.split('_')[1])
    show_products(call.message.chat.id, call.message.message_id, page)

def send_product_detail(chat_id, prod_id, message_id=None):
    p = db.get_product(prod_id)
    if not p:
        if message_id:
            bot.edit_message_text("Produk tidak ditemukan.", chat_id, message_id)
        else:
            bot.send_message(chat_id, "Produk tidak ditemukan.")
        return
        
    stok = db.get_stock_count(prod_id)
    text = f"📦 *{p['name']}*\n\n" \
           f"💵 Harga: {format_rupiah(p['price'])}\n" \
           f"📊 Stok Tersedia: {stok}\n\n" \
           f"📝 *Deskripsi:*\n{p['description']}"
           
    markup = InlineKeyboardMarkup(row_width=2)
    if stok > 0:
        markup.add(InlineKeyboardButton("💳 Beli Sekarang", callback_data=f"buy_{prod_id}"))
    else:
        markup.add(InlineKeyboardButton("❌ Stok Habis", callback_data="empty_stock"))
    markup.add(InlineKeyboardButton("🔙 Kembali", callback_data="user_list_products"))
    
    if message_id:
        bot.edit_message_text(text, chat_id, message_id, reply_markup=markup, parse_mode='Markdown')
    else:
        bot.send_message(chat_id, text, reply_markup=markup, parse_mode='Markdown')

@bot.callback_query_handler(func=lambda call: call.data.startswith('prod_detail_'))
def handle_product_detail_call(call):
    prod_id = int(call.data.split('_')[2])
    send_product_detail(call.message.chat.id, prod_id, call.message.message_id)

@bot.callback_query_handler(func=lambda call: call.data.startswith('buy_'))
def handle_buy_product(call):
    chat_id = call.message.chat.id
    prod_id = int(call.data.split('_')[1])
    p = db.get_product(prod_id)
    stok = db.get_stock_count(prod_id)
    
    if stok <= 0:
        bot.answer_callback_query(call.id, "Maaf, stok sudah habis.", show_alert=True)
        return
        
    set_state(chat_id, 'WAITING_QTY', {'product_id': prod_id, 'price': p['price'], 'max_stok': stok, 'name': p['name']})
    
    msg = bot.send_message(chat_id, f"Berapa jumlah *{p['name']}* yang ingin Anda beli?\n_(Maksimal: {stok})_\n\nKetik jumlah berupa angka:", parse_mode='Markdown')
    bot.register_next_step_handler(msg, process_qty)

def process_qty(message):
    chat_id = message.chat.id
    state = get_state(chat_id)
    if state['state'] != 'WAITING_QTY': return
    
    data = state['data']
    try:
        qty = int(message.text)
        if qty <= 0:
            msg = bot.send_message(chat_id, "Jumlah harus lebih dari 0. Silakan ketik angka lagi:")
            bot.register_next_step_handler(msg, process_qty)
            return
        if qty > data['max_stok']:
            msg = bot.send_message(chat_id, f"Jumlah melebihi stok. Maksimal pemesanan: {data['max_stok']}. Ketik angka lagi:")
            bot.register_next_step_handler(msg, process_qty)
            return
            
        # Detail pesanan valid
        total_price = qty * data['price']
        invoice_id = generate_invoice_id()
        db.create_order(invoice_id, chat_id, data['product_id'], qty, total_price)
        
        text = f"🧾 *INVOICE #{invoice_id}*\n\n" \
               f"Produk: {data['name']}\n" \
               f"Jumlah: {qty}\n" \
               f"Harga: {format_rupiah(data['price'])}\n\n" \
               f"💰 *Total: {format_rupiah(total_price)}*\n\n" \
               f"Silakan transfer ke:\n" \
               f"🏦 Bank: *{BANK_NAME}*\n" \
               f"🔢 No Rek: *{NOREK}*\n" \
               f"👤 Atas Nama: *{ATAS_NAMA}*\n\n" \
               f"Lalu kirimkan FOTO bukti transfer Anda ke chat ini."
        
        set_state(chat_id, 'WAITING_PROOF', {'invoice_id': invoice_id})
        bot.send_message(chat_id, text, parse_mode='Markdown')
        
    except ValueError:
        msg = bot.send_message(chat_id, "Mohon masukkan angka yang valid.")
        bot.register_next_step_handler(msg, process_qty)

@bot.message_handler(content_types=['photo'])
def handle_payment_proof(message):
    chat_id = message.chat.id
    state = get_state(chat_id)
    if state['state'] == 'WAITING_PROOF':
        invoice_id = state['data']['invoice_id']
        file_id = message.photo[-1].file_id
        
        db.update_order_proof(invoice_id, file_id)
        clear_state(chat_id)
        
        # Kirim ke user
        bot.send_message(chat_id, "✅ *Bukti transfer telah diterima.*\n\nMohon tunggu konfirmasi admin. Produk akan dikirimkan otomatis setelah pembayaran divalidasi.", parse_mode='Markdown')
        
        # Teruskan ke Admin
        order = db.get_order(invoice_id)
        p = db.get_product(order['product_id'])
        admin_text = f"🚨 *PEMBAYARAN BARU* 🚨\n\n" \
                     f"Invoice: {invoice_id}\n" \
                     f"User: [{message.chat.username or message.chat.first_name}](tg://user?id={chat_id})\n" \
                     f"Produk: {p['name']} (x{order['qty']})\n" \
                     f"Total: {format_rupiah(order['total_price'])}"
                     
        markup = InlineKeyboardMarkup(row_width=2)
        markup.add(
            InlineKeyboardButton("✅ Konfirmasi", callback_data=f"adm_acc_{invoice_id}"),
            InlineKeyboardButton("❌ Tolak", callback_data=f"adm_rej_{invoice_id}")
        )
        
        bot.send_photo(ADMIN_ID, file_id, caption=admin_text, reply_markup=markup, parse_mode='Markdown')


# ==========================================
# BAGIAN ADMIN
# ==========================================

@bot.message_handler(commands=['admin'])
def admin_menu(message):
    if message.chat.id != ADMIN_ID: return
    
    users_count = db.count_users()
    succ_orders, total_rev = db.count_success_orders()
    
    text = f"👨‍💻 *PANEL ADMIN*\n\n" \
           f"👥 Total User: {users_count}\n" \
           f"🛒 Transaksi Berhasil: {succ_orders}\n" \
           f"💰 Total Omset: {format_rupiah(total_rev)}\n\n" \
           f"Silakan pilih menu manajemen:"
           
    markup = InlineKeyboardMarkup(row_width=2)
    markup.add(
        InlineKeyboardButton("➕ Tambah Produk", callback_data="adm_add_product"),
        InlineKeyboardButton("✏ List / Edit Produk", callback_data="adm_list_product")
    )
    markup.add(
        InlineKeyboardButton("📦 Tambah Stok", callback_data="adm_add_stock"),
        InlineKeyboardButton("📢 Broadcast", callback_data="adm_broadcast")
    )
    bot.send_message(message.chat.id, text, reply_markup=markup, parse_mode='Markdown')

@bot.callback_query_handler(func=lambda call: call.data.startswith('adm_'))
def handle_admin_callbacks(call):
    chat_id = call.message.chat.id
    if chat_id != ADMIN_ID: return
    action = call.data
    
    if action == "adm_add_product":
        set_state(chat_id, 'ADMIN_ADD_PROD_NAME')
        msg = bot.send_message(chat_id, "Masukkan NAMA produk baru:")
        bot.register_next_step_handler(msg, admin_process_add_prod_name)
        
    elif action == "adm_list_product":
        prods = db.get_all_products()
        markup = InlineKeyboardMarkup()
        for p in prods:
            markup.add(InlineKeyboardButton(f"{p['name']} - {format_rupiah(p['price'])}", callback_data=f"adm_editprod_{p['id']}"))
        bot.edit_message_text("Pilih produk untuk diedit/dihapus:", chat_id, call.message.message_id, reply_markup=markup)
        
    elif action == "adm_add_stock":
        prods = db.get_all_products()
        markup = InlineKeyboardMarkup()
        for p in prods:
            markup.add(InlineKeyboardButton(f"{p['name']}", callback_data=f"adm_addstk_{p['id']}"))
        bot.edit_message_text("Pilih produk yang akan ditambah stok:", chat_id, call.message.message_id, reply_markup=markup)
        
    elif action.startswith("adm_addstk_"):
        prod_id = int(action.split('_')[2])
        set_state(chat_id, 'ADMIN_ADD_STOCK', {'product_id': prod_id})
        text = "Kirim list stok (bisa pakai enter untuk massal).\n\n" \
               "Contoh:\nemail1|pass1\nemail2|pass2\n\nKirimkan teksnya:"
        msg = bot.send_message(chat_id, text)
        bot.register_next_step_handler(msg, admin_process_add_stock)

    elif action.startswith("adm_acc_"):
        invoice_id = action.split('_')[2]
        admin_confirm_payment(call, invoice_id)
        
    elif action.startswith("adm_rej_"):
        invoice_id = action.split('_')[2]
        db.update_order_status(invoice_id, 'rejected')
        order = db.get_order(invoice_id)
        bot.edit_message_caption("❌ *DITOLAK*\n\n" + call.message.caption, chat_id, call.message.message_id, parse_mode='Markdown')
        bot.send_message(order['user_id'], f"❌ Transaksi {invoice_id} Anda DITOLAK oleh admin. Hubungi admin jika ini kesalahan.")

# -- Flow Add Produk --
def admin_process_add_prod_name(message):
    set_state(message.chat.id, 'ADMIN_ADD_PROD_DESC', {'name': message.text})
    msg = bot.send_message(message.chat.id, "Masukkan DESKRIPSI produk:")
    bot.register_next_step_handler(msg, admin_process_add_prod_desc)

def admin_process_add_prod_desc(message):
    state = get_state(message.chat.id)
    data = state['data']
    data['description'] = message.text
    set_state(message.chat.id, 'ADMIN_ADD_PROD_PRICE', data)
    msg = bot.send_message(message.chat.id, "Masukkan HARGA produk (Angka saja, misal: 15000):")
    bot.register_next_step_handler(msg, admin_process_add_prod_price)

def admin_process_add_prod_price(message):
    state = get_state(message.chat.id)
    data = state['data']
    try:
        price = float(message.text)
        db.add_product(data['name'], data['description'], price)
        bot.send_message(message.chat.id, "✅ Produk berhasil ditambahkan!")
        clear_state(message.chat.id)
    except ValueError:
        msg = bot.send_message(message.chat.id, "❌ Harga tidak valid. Masukkan angka saja:")
        bot.register_next_step_handler(msg, admin_process_add_prod_price)

# -- Flow Add Stok --
def admin_process_add_stock(message):
    state = get_state(message.chat.id)
    if state['state'] != 'ADMIN_ADD_STOCK': return
    prod_id = state['data']['product_id']
    
    lines = message.text.split('\n')
    added = 0
    for line in lines:
        if line.strip():
            db.add_stock(prod_id, line.strip())
            added += 1
            
    bot.send_message(message.chat.id, f"✅ Berhasil menambahkan {added} stok baru untuk produk tersebut.")
    clear_state(message.chat.id)

# -- Logic Konfirmasi Pembayaran --
def admin_confirm_payment(call, invoice_id):
    chat_id = call.message.chat.id
    order = db.get_order(invoice_id)
    if not order or order['status'] != 'pending':
        bot.answer_callback_query(call.id, "Order tidak ditemukan atau sudah diproses.", show_alert=True)
        return
        
    product_id = order['product_id']
    qty = order['qty']
    user_id = order['user_id']
    
    # Cek ketersediaan stok
    available_stock = db.get_available_stock(product_id, qty)
    if len(available_stock) < qty:
        bot.send_message(chat_id, f"⚠️ Gagal! Stok tidak cukup. Dibutuhkan: {qty}, Tersisa: {len(available_stock)}.\n"
                                  f"Silakan tambah stok terlebih dahulu, lalu klik Konfirmasi lagi.")
        return
        
    # Proses pengiriman stok
    stock_ids = [item['id'] for item in available_stock]
    stock_data = [item['data'] for item in available_stock]
    
    db.mark_stock_sold(stock_ids, invoice_id)
    db.update_order_status(invoice_id, 'paid')
    
    # Update UI Admin
    bot.edit_message_caption("✅ *BERHASIL DIKONFIRMASI*\n\n" + call.message.caption, chat_id, call.message.message_id, parse_mode='Markdown')
    
    # Kirim ke target pembeli
    delivery_text = f"🎉 *PEMBAYARAN BERHASIL*\n\n" \
                    f"Terima kasih, pembayaran Invoice `{invoice_id}` telah dikonfirmasi!\n" \
                    f"Berikut adalah detail produk Anda:\n\n"
                    
    for i, data in enumerate(stock_data, 1):
        delivery_text += f"{i}. <code>{data}</code>\n"
        
    delivery_text += "\n_Terima kasih telah berbelanja di toko kami!_"
    bot.send_message(user_id, delivery_text, parse_mode='HTML')


if __name__ == "__main__":
    print("Bot is polling...")
    bot.infinity_polling()
