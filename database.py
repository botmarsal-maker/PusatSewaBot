import sqlite3
import threading
from config import DB_NAME

# Hindari error write lock pada SQLite di multi-threading
lock = threading.Lock()

def get_connection():
    return sqlite3.connect(DB_NAME, check_same_thread=False)

def init_db():
    with lock:
        conn = get_connection()
        c = conn.cursor()
        
        # Tabel Users
        c.execute('''CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )''')
        
        # Tabel Products
        c.execute('''CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            description TEXT,
            price REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )''')
        
        # Tabel Stock
        c.execute('''CREATE TABLE IF NOT EXISTS stock (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            data TEXT,
            status TEXT DEFAULT 'available',
            order_id TEXT,
            FOREIGN KEY(product_id) REFERENCES products(id)
        )''')
        
        # Tabel Orders
        c.execute('''CREATE TABLE IF NOT EXISTS orders (
            invoice_id TEXT PRIMARY KEY,
            user_id INTEGER,
            product_id INTEGER,
            qty INTEGER,
            total_price REAL,
            status TEXT DEFAULT 'pending',
            payment_proof TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        )''')
        
        conn.commit()
        conn.close()

# --- FUNGSI USER ---
def add_user(user_id, username):
    with lock:
        conn = get_connection()
        c = conn.cursor()
        c.execute("INSERT OR IGNORE INTO users (id, username) VALUES (?, ?)", (user_id, username))
        conn.commit()
        conn.close()

def count_users():
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM users")
    count = c.fetchone()[0]
    conn.close()
    return count

# --- FUNGSI PRODUK ---
def add_product(name, description, price):
    with lock:
        conn = get_connection()
        c = conn.cursor()
        c.execute("INSERT INTO products (name, description, price) VALUES (?, ?, ?)", (name, description, price))
        conn.commit()
        conn.close()

def get_all_products():
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM products")
    products = [dict(row) for row in c.fetchall()]
    conn.close()
    return products

def get_product(product_id):
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None

def update_product(product_id, name, description, price):
    with lock:
        conn = get_connection()
        c = conn.cursor()
        c.execute("UPDATE products SET name=?, description=?, price=? WHERE id=?", (name, description, price, product_id))
        conn.commit()
        conn.close()

def delete_product(product_id):
    with lock:
        conn = get_connection()
        c = conn.cursor()
        c.execute("DELETE FROM products WHERE id = ?", (product_id,))
        c.execute("DELETE FROM stock WHERE product_id = ?", (product_id,))
        conn.commit()
        conn.close()

# --- FUNGSI STOK ---
def add_stock(product_id, data):
    with lock:
        conn = get_connection()
        c = conn.cursor()
        c.execute("INSERT INTO stock (product_id, data) VALUES (?, ?)", (product_id, data))
        conn.commit()
        conn.close()

def get_stock_count(product_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM stock WHERE product_id = ? AND status = 'available'", (product_id,))
    count = c.fetchone()[0]
    conn.close()
    return count

def get_available_stock(product_id, limit):
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT id, data FROM stock WHERE product_id = ? AND status = 'available' LIMIT ?", (product_id, limit))
    rows = [dict(row) for row in c.fetchall()]
    conn.close()
    return rows

def mark_stock_sold(stock_ids, order_id):
    with lock:
        conn = get_connection()
        c = conn.cursor()
        for idx in stock_ids:
            c.execute("UPDATE stock SET status = 'sold', order_id = ? WHERE id = ?", (order_id, idx))
        conn.commit()
        conn.close()

# --- FUNGSI TRANSAKSI / ORDER ---
def create_order(invoice_id, user_id, product_id, qty, total_price):
    with lock:
        conn = get_connection()
        c = conn.cursor()
        c.execute("INSERT INTO orders (invoice_id, user_id, product_id, qty, total_price) VALUES (?, ?, ?, ?, ?)",
                  (invoice_id, user_id, product_id, qty, total_price))
        conn.commit()
        conn.close()

def update_order_proof(invoice_id, payment_proof):
    with lock:
        conn = get_connection()
        c = conn.cursor()
        c.execute("UPDATE orders SET payment_proof = ? WHERE invoice_id = ?", (payment_proof, invoice_id))
        conn.commit()
        conn.close()

def update_order_status(invoice_id, status):
    with lock:
        conn = get_connection()
        c = conn.cursor()
        c.execute("UPDATE orders SET status = ? WHERE invoice_id = ?", (status, invoice_id))
        conn.commit()
        conn.close()

def get_order(invoice_id):
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM orders WHERE invoice_id = ?", (invoice_id,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_orders(user_id):
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 10", (user_id,))
    rows = [dict(row) for row in c.fetchall()]
    conn.close()
    return rows

def count_success_orders():
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*), SUM(total_price) FROM orders WHERE status = 'paid'")
    row = c.fetchone()
    conn.close()
    return row[0] or 0, row[1] or 0
