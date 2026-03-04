from flask import Blueprint, request, jsonify
from backend.db import get_db

candidate_bp = Blueprint("candidate_bp", __name__)

# ---------------- ADD CANDIDATE ----------------
@candidate_bp.route("/", methods=["POST"])
def add_candidate():
    data = request.get_json()

    election_id = data.get("election_id")
    name = data.get("name")


    db = get_db()
    cur = db.cursor()

    cur.execute(
        "INSERT INTO candidates (election_id, name) VALUES (%s, %s)",
        (election_id, name)
    )

    db.commit()
    db.close()

    return jsonify({"message": "Candidate added successfully"})

# ---------------- LIST CANDIDATES (ACTIVE ELECTION ONLY) ----------------
@candidate_bp.route("/", methods=["GET"])
def list_candidates():
    db = get_db()
    cur = db.cursor(dictionary=True)

    # Step 1: Get active election
    cur.execute("SELECT election_id FROM elections WHERE is_active = 1 LIMIT 1")
    active_election = cur.fetchone()

    if not active_election:
        db.close()
        return jsonify({"error": "No active election found"}), 400

    election_id = active_election["election_id"]

    # Step 2: Get candidates ONLY for active election
    cur.execute("""
        SELECT c.candidate_id, c.name, c.election_id, e.title AS election_title
        FROM candidates c
        JOIN elections e ON c.election_id = e.election_id
        WHERE c.election_id = %s
    """, (election_id,))

    candidates = cur.fetchall()

    db.close()

    return jsonify(candidates)
# ---------------- DELETE CANDIDATE ----------------
@candidate_bp.route("/<int:candidate_id>", methods=["DELETE"])
def delete_candidate(candidate_id):
    db = get_db()
    cur = db.cursor(dictionary=True)

    try:
        # Check if votes exist for this candidate
        cur.execute(
            "SELECT COUNT(*) as count FROM votes WHERE candidate_id=%s",
            (candidate_id,)
        )
        result = cur.fetchone()

        if result["count"] > 0:
            db.close()
            return jsonify({
                "error": "Cannot delete candidate. Votes already exist."
            }), 400

        # If no votes then delete
        cur.execute(
            "DELETE FROM candidates WHERE candidate_id=%s",
            (candidate_id,)
        )
        db.commit()

    except Exception as e:
        db.close()
        return jsonify({"error": str(e)}), 400

    db.close()
    return jsonify({"message": "Candidate deleted successfully"})
