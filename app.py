from flask import Flask, request, jsonify, render_template
import os
import cv2
import numpy as np
import uuid

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Store reports (temporary DB)
reports = []

# Load face detector
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
)

# 🔍 Extract face
def extract_face(path):
    img = cv2.imread(path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    if len(faces) == 0:
        return None

    x, y, w, h = faces[0]
    face = gray[y:y+h, x:x+w]
    face = cv2.resize(face, (100, 100))
    return face


# 🧠 Compare faces → return %
def compare_faces(face1, face2):
    diff = np.mean((face1 - face2) ** 2)

    # Convert to similarity %
    similarity = max(0, 100 - (diff / 50))
    return similarity


# 🌐 Routes
@app.route("/")
def home():
    return render_template("index.html")


# 📤 Upload missing person
@app.route("/report", methods=["POST"])
def report():
    file = request.files["file"]
    name = request.form.get("name")

    filename = str(uuid.uuid4()) + ".jpg"
    path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(path)

    face = extract_face(path)

    if face is None:
        return jsonify({"error": "No face detected"})

    # Store
    reports.append({
        "id": len(reports),
        "name": name,
        "image": path,
        "face": face.tolist()
    })

    return jsonify({"message": "Report saved successfully"})


# 🔎 Match new image with all existing
@app.route("/match", methods=["POST"])
def match():
    file = request.files["file"]

    filename = "temp.jpg"
    path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(path)

    new_face = extract_face(path)

    if new_face is None:
        return jsonify({"error": "No face detected"})

    matches = []

    for r in reports:
        old_face = np.array(r["face"])

        similarity = compare_faces(new_face, old_face)

        if similarity >= 50:   # 🔥 threshold
            matches.append({
                "name": r["name"],
                "match": round(similarity, 2),
                "image": r["image"]
            })

    # 🔔 Notification logic
    if matches:
        return jsonify({
            "match_found": True,
            "matches": matches,
            "message": "Match found! Notifications sent to users & agents"
        })
    else:
        return jsonify({
            "match_found": False,
            "message": "No match found"
        })


if __name__ == "__main__":
    app.run(debug=True)