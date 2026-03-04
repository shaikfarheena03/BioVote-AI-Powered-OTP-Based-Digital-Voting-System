from flask import Blueprint, request, jsonify
from backend.db import get_db
import face_recognition
import numpy as np
import base64
import cv2

voter_bp = Blueprint("voter_bp", __name__)

# ---------------- ADD VOTER ----------------
@voter_bp.route("/", methods=["POST"])
def add_voter():
    data = request.get_json()

    voter_id = data.get("voter_id")
    name = data.get("name")
    mobile = data.get("mobile")
    is_active = data.get("is_active", True)
    face_image_base64 = data.get("face_image")

    if not voter_id or not name or not mobile or not face_image_base64:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        # Decode base64 image
        image_bytes = base64.b64decode(face_image_base64)
        np_array = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

        # Convert BGR to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Extract face encodings
        encodings = face_recognition.face_encodings(rgb_image)

        if len(encodings) == 0:
            return jsonify({"error": "No face detected"}), 400

        face_encoding = encodings[0]

        # Convert encoding to string for DB storage
        face_encoding_str = ",".join(map(str, face_encoding.tolist()))

    except Exception as e:
        return jsonify({"error": f"Face processing failed: {str(e)}"}), 400

    db = get_db()
    cur = db.cursor()

    try:
        cur.execute(
            "INSERT INTO voters (voter_id, name, mobile, is_active, face_encoding) VALUES (%s, %s, %s, %s, %s)",
            (voter_id, name, mobile, is_active, face_encoding_str)
        )
        db.commit()
    except Exception as e:
        db.close()
        return jsonify({"error": str(e)}), 400

    db.close()

    return jsonify({"message": "Voter added with face successfully"})

@voter_bp.route("/<voter_id>", methods=["DELETE"])
def delete_voter(voter_id):
    db = get_db()
    cur = db.cursor()

    cur.execute("DELETE FROM voters WHERE voter_id=%s", (voter_id,))
    db.commit()
    db.close()

    return {"message": "Voter deleted successfully"}


# ---------------- LIST VOTERS ----------------
@voter_bp.route("/", methods=["GET"])
def list_voters():
    db = get_db()
    cur = db.cursor(dictionary=True)

    cur.execute("SELECT * FROM voters")
    voters = cur.fetchall()

    db.close()

    return jsonify(voters)

# ---------------- GET SINGLE VOTER ----------------
@voter_bp.route("/<voter_id>", methods=["GET"])
def get_voter(voter_id):
    db = get_db()
    cur = db.cursor(dictionary=True)

    cur.execute(
        "SELECT voter_id, name, mobile, is_active FROM voters WHERE voter_id=%s",
        (voter_id,)
    )

    voter = cur.fetchone()
    db.close()

    if not voter:
        return jsonify({"error": "Voter not found"}), 404

    if not voter["is_active"]:
        return jsonify({"error": "Voter is inactive"}), 400

    return jsonify(voter), 200

# ---------------- Edit voters ----------------
@voter_bp.route("/<string:voter_id>", methods=["PUT"])
def update_voter(voter_id):
    data = request.get_json()
    name = data.get("name")
    mobile = data.get("mobile")

    db = get_db()
    cur = db.cursor()

    cur.execute(
        "UPDATE voters SET name=%s, mobile=%s WHERE voter_id=%s",
        (name, mobile, voter_id)
    )

    db.commit()
    db.close()

    return jsonify({"message": "Voter updated successfully"})