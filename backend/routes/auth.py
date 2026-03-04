from flask import Blueprint, request, jsonify
from backend.db import get_db
import random
import face_recognition
import numpy as np
import base64
import cv2
import os
import requests
import dlib
import imutils
from imutils import face_utils
from scipy.spatial import distance as dist
from twilio.rest import Client

auth_bp = Blueprint("auth_bp", __name__)

# Temporary in-memory OTP store
otp_store = {}
# Temporary verified voters store
verified_voters = {}
face_verified_voters = {}

print("SID:", os.getenv("TWILIO_ACCOUNT_SID"))

def send_otp_sms(mobile_number, otp):
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_number = os.getenv("TWILIO_PHONE_NUMBER")

    client = Client(account_sid, auth_token)

    try:
        message = client.messages.create(
            body=f" OTP for Verification is {otp}. Do not share it with anyone.",
            from_=twilio_number,
            to=f"+91{mobile_number}"
        )

        print("Twilio SID:", message.sid)
        return True

    except Exception as e:
        print("Twilio Error:", str(e))
        return False
# ---------------- SEND OTP ----------------
@auth_bp.route("/send-otp", methods=["POST"])
def send_otp():
    data = request.get_json()
    voter_id = data.get("voter_id")

    if not voter_id:
        return jsonify({"error": "voter_id required"}), 400

    db = get_db()
    cur = db.cursor(dictionary=True)

    # Fetch voter mobile number
    cur.execute(
        "SELECT mobile FROM voters WHERE voter_id=%s AND is_active=TRUE",
        (voter_id,)
    )
    voter = cur.fetchone()
    db.close()

    if not voter:
        return jsonify({"error": "Invalid or inactive voter"}), 400

    mobile_number = voter.get("mobile")

    if not mobile_number:
        return jsonify({"error": "Mobile number not registered"}), 400

    # Generate 6-digit OTP
    otp = random.randint(100000, 999999)

    # Store OTP temporarily
    otp_store[voter_id] = otp

    # Send OTP using Twilio
    sms_sent = send_otp_sms(mobile_number, otp)

    if not sms_sent:
        return jsonify({"error": "Failed to send OTP"}), 500

    return jsonify({"message": "OTP sent successfully"})


# ---------------- VERIFY OTP ----------------
@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    data = request.get_json()
    voter_id = data.get("voter_id")
    otp_input = data.get("otp")

    if voter_id not in otp_store:
        return jsonify({"error": "OTP not requested"}), 400

    if str(otp_store[voter_id]) == str(otp_input):
        del otp_store[voter_id]
        verified_voters[voter_id] = True
        return jsonify({"message": "OTP verified successfully"})

    return jsonify({"error": "Invalid OTP"}), 400


# ---------------- FACE VERIFY ----------------
@auth_bp.route("/face-verify", methods=["POST"])
def face_verify():
    data = request.get_json()

    voter_id = data.get("voter_id")
    face_image_base64 = data.get("face_image")

    if not voter_id or not face_image_base64:
        return jsonify({"error": "Missing voter_id or face_image"}), 400

    db = get_db()
    cur = db.cursor(dictionary=True)

    # Fetch stored encoding
    cur.execute(
        "SELECT face_encoding FROM voters WHERE voter_id=%s AND is_active=TRUE",
        (voter_id,)
    )
    voter = cur.fetchone()
    db.close()

    if not voter or not voter["face_encoding"]:
        return jsonify({"error": "Face data not found for voter"}), 400

    try:
        # Convert stored encoding back to numpy
        stored_encoding = np.array(
            list(map(float, voter["face_encoding"].split(",")))
        )

        if "," in face_image_base64:
            face_image_base64 = face_image_base64.split(",")[1]

        # Decode captured image
        image_bytes = base64.b64decode(face_image_base64)
        np_array = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

        if image is None:
            return jsonify({"error": "Invalid image received"}), 400

        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Extract encoding
        encodings = face_recognition.face_encodings(rgb_image)

        if len(encodings) == 0:
            return jsonify({"error": "No face detected"}), 400

        captured_encoding = encodings[0]

        # Compute face distance
        distance = face_recognition.face_distance(
            [stored_encoding],
            captured_encoding
        )[0]

        print(f"[DEBUG] Face Distance for {voter_id}: {distance}")

        # ---------------- SECURITY THRESHOLD ----------------
        THRESHOLD = 0.45   # adjust if needed

        if distance < THRESHOLD:
            face_verified_voters[voter_id] = True

            return jsonify({
                "message": "Face verified successfully",
                "distance": float(distance),
                "threshold": THRESHOLD
            }), 200
        else:
            return jsonify({
                "error": "Face does not match",
                "distance": float(distance),
                "threshold": THRESHOLD
            }), 401

    except Exception as e:
        print("Face verification error:", str(e))
        return jsonify({"error": f"Face verification failed: {str(e)}"}), 400

# Load dlib face detector and landmark predictor
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")
def eye_aspect_ratio(eye):
    A = dist.euclidean(eye[1], eye[5])
    B = dist.euclidean(eye[2], eye[4])
    C = dist.euclidean(eye[0], eye[3])
    ear = (A + B) / (2.0 * C)
    return ear
@auth_bp.route("/liveness-check", methods=["POST"])
def liveness_check():
    data = request.get_json()
    voter_id = data.get("voter_id")
    frames = data.get("frames")

    if not voter_id or not frames:
        return jsonify({"error": "Missing voter_id or frames"}), 400

    EYE_AR_THRESH = 0.20
    REQUIRED_BLINKS = 1   # keep 1 for testing

    blink_count = 0
    eye_closed = False

    for frame_base64 in frames:
        try:
            if "," in frame_base64:
                frame_base64 = frame_base64.split(",")[1]

            image_bytes = base64.b64decode(frame_base64)
            np_array = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            rects = detector(gray, 0)

            if len(rects) == 0:
                continue

            rect = rects[0]   # only first face

            shape = predictor(gray, rect)
            shape = face_utils.shape_to_np(shape)

            (lStart, lEnd) = face_utils.FACIAL_LANDMARKS_IDXS["left_eye"]
            (rStart, rEnd) = face_utils.FACIAL_LANDMARKS_IDXS["right_eye"]

            leftEye = shape[lStart:lEnd]
            rightEye = shape[rStart:rEnd]

            leftEAR = eye_aspect_ratio(leftEye)
            rightEAR = eye_aspect_ratio(rightEye)

            ear = (leftEAR + rightEAR) / 2.0
            print("EAR:", ear)

            
            if ear < EYE_AR_THRESH:
                if not eye_closed:
                    eye_closed = True
            else:
                if eye_closed:
                    blink_count += 1
                    print(f"[DEBUG] Blink detected: {blink_count}")
                    eye_closed = False

            if blink_count >= REQUIRED_BLINKS:
                break

        except Exception as e:
            print("Frame processing error:", str(e))

  
    if blink_count < REQUIRED_BLINKS:
        return jsonify({"error": "Please blink. Liveness failed."}), 401

    return jsonify({"message": "Liveness check passed"}), 200