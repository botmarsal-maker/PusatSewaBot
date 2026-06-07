# Tutorial Instalasi Bot Telegram Auto Order (Digital Product) di VPS Ubuntu

Bot ini dibangun menggunakan Python (`pyTelegramBotAPI`) dan database bawaan SQLite.
Tidak memerlukan resource besar dan dapat berjalan dengan lancar di server VPS (Ubuntu/Debian).

## 1. Persiapan VPS
Pastikan VPS Anda sudah memiliki instalasi Python 3 dan PIP.
Login ke VPS Anda menggunakan SSH.

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install python3 python3-pip python3-venv sqlite3 screen -y
```

## 2. Pindahkan Source Code ke VPS
Anda bisa upload file-file (`bot.py`, `database.py`, `config.py`, `requirements.txt`, `.env.example`) ini menggunakan SFTP/FileZilla atau GitHub ke direktori VPS Anda, misal di `/root/bot-toko/`.

```bash
mkdir /root/bot-toko
cd /root/bot-toko
# (Upload file-filenya ke dalam folder ini)
```

## 3. Konfigurasi Environment (Virtual Env)
Sangat direkomendasikan menggunakan Virtual Environment untuk instalasi library.

```bash
cd /root/bot-toko
python3 -m venv venv
source venv/bin/activate
```

## 4. Install Dependencies
```bash
pip install -r requirements.txt
```

## 5. Konfigurasi Token dan Akun Bank
Ganti file konfigurasi `.env`. Rename `.env.example` menjadi `.env`.

```bash
mv .env.example .env
nano .env
```

Ubah menjadi data Anda sendiri:
```env
BOT_TOKEN=7XXXXXX:AAHxxxxxxxxxxxxx  # Token dari BotFather
ADMIN_ID=123456789                  # ID Telegram Anda (dapat dari @userinfobot)
BANK_NAME=BCA                       # Nama bank terima pembayaran
NOREK=1234567890                    # No rekening
ATAS_NAMA=PUSAT SEWA BOT            # Atas nama rekening
```
Simpan (`Ctrl+X`, lalu `Y`, lalu `Enter`).

## 6. Menjalankan Bot di Background (menggunakan Screen)
Agar bot tidak mati ketika Anda keluar dari SSH, Anda bisa menggunakan `screen`.

```bash
# Buat session baru bernama 'bot'
screen -S bot

# Jalankan bot
python bot.py
```
*(Anda akan melihat pesan "Bot is polling...")*

Untuk keluar dari screen tanpa mematikan bot, tekan **Ctrl + A**, lalupaskan tombol, tekan **D**.

Untuk kembali melihat console bot nantinya:
```bash
screen -r bot
```

## 7. Alternatif Menjalankan menggunakan SystemD (Auto Restart)
Jika ingin bot otomatis menyala saat VPS direstart:

Buat file daemon:
```bash
sudo nano /etc/systemd/system/telegrambot.service
```

Isikan dengan:
```ini
[Unit]
Description=Telegram Auto Order Bot
After=network.target

[Service]
User=root
WorkingDirectory=/root/bot-toko
ExecStart=/root/bot-toko/venv/bin/python /root/bot-toko/bot.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Nyalakan service:
```bash
sudo systemctl daemon-reload
sudo systemctl start telegrambot
sudo systemctl enable telegrambot
sudo systemctl status telegrambot
```

## 8. Selesai!
Buka Telegram dan ketik `/start` ke bot Anda.
Sebagai admin (jika ID sesuai `ADMIN_ID`), Anda dapat mengirim perintah `/admin` untuk masuk ke halaman manajemen toko.
