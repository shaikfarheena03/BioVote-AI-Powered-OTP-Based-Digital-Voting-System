from flask import Blueprint, request, jsonify
from backend.db import get_db
from backend.routes.auth import verified_voters, face_verified_voters

vote_bp = Blueprint("vote_bp", __name__)

@vote_bp.route("/", methods=["POST"])
def cast_vote():
    data = request.get_json()

    voter_id = data.get("voter_id")
    candidate_id = data.get("candidate_id")

    if not voter_id or not candidate_id:
        return jsonify({"error": "Missing voter_id or candidate_id"}), 400

    db = get_db()
    cur = db.cursor(dictionary=True)

    # 1️⃣ Check voter exists and is active
    cur.execute(
        "SELECT * FROM voters WHERE voter_id=%s AND is_active=TRUE",
        (voter_id,)
    )
    voter = cur.fetchone()

    if not voter:
        db.close()
        return jsonify({"error": "Invalid or inactive voter"}), 400

    #2️⃣  Check Face verification
    if voter_id not in face_verified_voters:
        db.close()
        return jsonify({"error": "Face verification required"}), 403
    
    #3️⃣ Check OTP verification
    if voter_id not in verified_voters:
        db.close()
        return jsonify({"error": "OTP verification required"}), 403



    # 4️⃣ Check active election
    cur.execute(
        "SELECT * FROM elections WHERE is_active=TRUE"
    )
    election = cur.fetchone()

    if not election:
        db.close()
        return jsonify({"error": "No active election"}), 400

    election_id = election["election_id"]

    # 5️⃣ Validate candidate belongs to active election
    cur.execute(
        "SELECT * FROM candidates WHERE candidate_id=%s AND election_id=%s",
        (candidate_id, election_id)
    )
    candidate = cur.fetchone()

    if not candidate:
        db.close()
        return jsonify({"error": "Invalid candidate for this election"}), 400

    # 6️⃣ Check voter has not already voted
    cur.execute(
        "SELECT * FROM vote_status WHERE voter_id=%s AND election_id=%s",
        (voter_id, election_id)
    )
    status = cur.fetchone()

    if status and status["has_voted"]:
        db.close()
        return jsonify({"error": "You have already voted"}), 400

    # 7️⃣ Insert vote anonymously
    cur.execute(
        "INSERT INTO votes (election_id, candidate_id) VALUES (%s, %s)",
        (election_id, candidate_id)
    )

    # 8️⃣ Update vote_status
    if status:
        cur.execute(
            "UPDATE vote_status SET has_voted=TRUE WHERE voter_id=%s AND election_id=%s",
            (voter_id, election_id)
        )
    else:
        cur.execute(
            "INSERT INTO vote_status (voter_id, election_id, has_voted) VALUES (%s, %s, TRUE)",
            (voter_id, election_id)
        )

    db.commit()
    db.close()

    # 🔐 Clear verification after vote
    if voter_id in verified_voters:
        del verified_voters[voter_id]

    if voter_id in face_verified_voters:
        del face_verified_voters[voter_id]

    return jsonify({"message": "Vote cast successfully"})
