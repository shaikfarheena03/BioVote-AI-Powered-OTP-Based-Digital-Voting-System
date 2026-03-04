from flask import Blueprint, request, jsonify
from backend.db import get_db

election_bp = Blueprint("election_bp", __name__)

# ---------------- ADD ELECTION ----------------
@election_bp.route("/", methods=["POST"])
def add_election():
    data = request.get_json()
    title = data.get("title")
    is_active = data.get("is_active", False)

    if not title:
        return jsonify({"error": "Election title required"}), 400

    db = get_db()
    cur = db.cursor()

    try:
        cur.execute(
            "INSERT INTO elections (title, is_active) VALUES (%s, %s)",
            (title, is_active)
        )
        db.commit()
    except Exception as e:
        db.close()
        return jsonify({"error": str(e)}), 400

    db.close()
    return jsonify({"message": "Election added successfully"})


# ---------------- LIST ELECTIONS ----------------
@election_bp.route("/", methods=["GET"])
def list_elections():
    db = get_db()
    cur = db.cursor(dictionary=True)

    cur.execute("SELECT * FROM elections")
    elections = cur.fetchall()

    db.close()
    return jsonify(elections)

# ---------------- ACTIVATE ELECTION ----------------
@election_bp.route("/<int:election_id>/activate", methods=["PUT"])
def activate_election(election_id):
    db = get_db()
    cur = db.cursor()

    try:
        # Set all elections inactive
        cur.execute("UPDATE elections SET is_active=FALSE")

        # Activate selected election
        cur.execute(
            "UPDATE elections SET is_active=TRUE WHERE election_id=%s",
            (election_id,)
        )

        db.commit()
    except Exception as e:
        db.close()
        return jsonify({"error": str(e)}), 400

    db.close()
    return jsonify({"message": "Election activated successfully"})


# ---------------- DELETE ELECTION ----------------
@election_bp.route("/<int:election_id>", methods=["DELETE"])
def delete_election(election_id):
    db = get_db()
    cur = db.cursor(dictionary=True)

    try:
        # Step 1: Check if candidates exist
        cur.execute(
            "SELECT COUNT(*) as count FROM candidates WHERE election_id=%s",
            (election_id,)
        )
        result = cur.fetchone()

        if result["count"] > 0:
            db.close()
            return jsonify({
                "error": "Cannot delete election. Candidates exist for this election."
            }), 400

        # Step 2: If no candidates → delete election
        cur.execute(
            "DELETE FROM elections WHERE election_id=%s",
            (election_id,)
        )
        db.commit()

    except Exception as e:
        db.close()
        return jsonify({"error": str(e)}), 400

    db.close()
    return jsonify({"message": "Election deleted successfully"})

# ---------------- ELECTION RESULTS ----------------
@election_bp.route("/<int:election_id>/results", methods=["GET"])
def election_results(election_id):
    db = get_db()
    cur = db.cursor(dictionary=True)

    try:
        cur.execute("""
            SELECT c.candidate_id, c.name,
            COUNT(v.vote_id) as votes
            FROM candidates c
            LEFT JOIN votes v
            ON c.candidate_id = v.candidate_id
            WHERE c.election_id = %s
            GROUP BY c.candidate_id
        """, (election_id,))

        results = cur.fetchall()

    except Exception as e:
        db.close()
        return jsonify({"error": str(e)}), 400

    db.close()
    return jsonify(results)
# ---------------- GET ACTIVE ELECTION ----------------
@election_bp.route("/active", methods=["GET"])
def get_active_election():
    db = get_db()
    cur = db.cursor(dictionary=True)

    cur.execute("SELECT * FROM elections WHERE is_active = 1 LIMIT 1")
    election = cur.fetchone()

    db.close()

    if not election:
        return jsonify({"error": "No active election"}), 404

    return jsonify(election)
# ---------------- END ELECTION ----------------
@election_bp.route("/<int:election_id>/end", methods=["PUT"])
def end_election(election_id):
    db = get_db()
    cur = db.cursor()

    # Set election inactive
    cur.execute(
        "UPDATE elections SET is_active = 0 WHERE election_id = %s",
        (election_id,)
    )

    db.commit()
    db.close()

    return jsonify({"message": "Election ended successfully"})