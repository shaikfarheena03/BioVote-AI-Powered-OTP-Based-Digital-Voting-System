import mysql.connector
from backend.config import DB_CONFIG

def get_db():
    return mysql.connector.connect(**DB_CONFIG)