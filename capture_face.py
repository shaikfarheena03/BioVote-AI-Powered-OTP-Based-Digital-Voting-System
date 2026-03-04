import cv2
import base64
import requests

# 🔹 Change this URL if needed
API_URL = "http://127.0.0.1:5000/api/voters/"

voter_id = "V700"
name = "Face Test User"
mobile = "8888888888"

# Open webcam
cap = cv2.VideoCapture(0)

print("Press 's' to capture face, 'q' to quit.")

while True:
    ret, frame = cap.read()
    cv2.imshow("Capture Face", frame)

    key = cv2.waitKey(1)

    if key == ord('s'):
        # Encode image to JPG
        _, buffer = cv2.imencode(".jpg", frame)
        image_bytes = buffer.tobytes()

        # Convert to base64
        face_base64 = base64.b64encode(image_bytes).decode("utf-8")

        # Prepare payload
        payload = {
            "voter_id": voter_id,
            "name": name,
            "mobile": mobile,
            "is_active": True,
            "face_image": face_base64
        }

        # Send to backend
        response = requests.post(API_URL, json=payload)
        print("Server response:", response.json())
        break

    elif key == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
