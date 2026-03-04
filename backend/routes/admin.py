from flask import Blueprint, request, jsonify
from backend.db import get_db
import bcrypt

admin_bp = Blueprint("admin_bp", __name__)

# ---------------- ADMIN LOGIN ----------------
@admin_bp.route("/login", methods=["POST"])
def admin_login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    db = get_db()
    cur = db.cursor(dictionary=True)

    cur.execute("SELECT * FROM admins WHERE username=%s", (username,))
    admin = cur.fetchone()
    db.close()

    if not admin:
        return jsonify({"error": "Invalid credentials"}), 401

    # Compare hashed password
    if bcrypt.checkpw(password.encode("utf-8"), admin["password"].encode("utf-8")):
        return jsonify({"message": "Login successful"}), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401
    
@admin_bp.route("/stats", methods=["GET"])
def get_admin_stats():
    db = get_db()
    cur = db.cursor(dictionary=True)

    # Total voters
    cur.execute("SELECT COUNT(*) as total FROM voters")
    total_voters = cur.fetchone()["total"]

    # Active election
    cur.execute("""
        SELECT election_id, title
        FROM elections
        WHERE is_active = 1
        LIMIT 1
    """)
    active = cur.fetchone()

    # If no active election
    if not active:
        db.close()
        return jsonify({
            "active_election": "No Active Election",
            "total_voters": total_voters,
            "total_candidates": 0,
            "total_votes": 0
        })

    election_id = active["election_id"]

    # Total candidates for active election
    cur.execute(
        "SELECT COUNT(*) as total FROM candidates WHERE election_id = %s",
        (election_id,)
    )
    total_candidates = cur.fetchone()["total"]

    # Total votes for active election
    cur.execute("""
        SELECT COUNT(*) as total
        FROM votes v
        JOIN candidates c ON v.candidate_id = c.candidate_id
        WHERE c.election_id = %s
    """, (election_id,))
    total_votes = cur.fetchone()["total"]

    db.close()

    return jsonify({
        "active_election": active["title"],
        "total_voters": total_voters,
        "total_candidates": total_candidates,
        "total_votes": total_votes
    })