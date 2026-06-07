import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv('BOT_TOKEN', '')
ADMIN_ID = int(os.getenv('ADMIN_ID', 0))
DB_NAME = 'bot_database.db'

# Konfigurasi Default Bank (bisa diambil dari sini atau DB)
BANK_NAME = os.getenv('BANK_NAME', 'BCA')
NOREK = os.getenv('NOREK', '1234567890')
ATAS_NAMA = os.getenv('ATAS_NAMA', 'Pusat Sewa Bot')
