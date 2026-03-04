import cv2
import base64
import requests

API_URL = "http://127.0.0.1:5000/api/auth/face-verify"

voter_id = "V600"

cap = cv2.VideoCapture(0)

print("Press 's' to verify face, 'q' to quit.")

while True:
    ret, frame = cap.read()
    cv2.imshow("Verify Face", frame)

    key = cv2.waitKey(1)

    if key == ord('s'):
        _, buffer = cv2.imencode(".jpg", frame)
        image_bytes = buffer.tobytes()

        face_base64 = base64.b64encode(image_bytes).decode("utf-8")

        payload = {
            "voter_id": voter_id,
            "face_image": face_base64
        }

        response = requests.post(API_URL, json=payload)
        print("Server response:", response.json())
        break

    elif key == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
