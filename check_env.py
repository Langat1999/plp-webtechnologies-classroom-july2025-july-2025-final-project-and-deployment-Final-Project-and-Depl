
try:
    from dotenv import load_dotenv
except ImportError:
    print("[ERROR] python-dotenv is not installed. Please install it via 'pip install python-dotenv'.")
    exit(1)
import os, sys
import logging
load_dotenv()
ok = True
def req(name):
    v = os.getenv(name, '')
    if not v:
        logging.warning(f"[MISSING] {name}")
        return False
    logging.info(f"[OK] {name} set")
    return True
ok &= req("HUGGINGFACE_TOKEN")
ok = True
ok &= req("OPENAI_API_KEY")
mysql = os.getenv("MYSQL_URL","")
logging.info(f"[VAL] MYSQL_URL = {mysql or '(using SQLite fallback)'}")
if mysql and not mysql.startswith("mysql+pymysql://"):
    logging.warning("[WARN] MYSQL_URL should start with mysql+pymysql://")
logging.info(f"Result: {'PASS' if ok else 'NEEDS FIX'}")
sys.exit(0 if ok else 1)
