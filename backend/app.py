import os
import tempfile
import numpy as np
import cv2
from PyPDF2 import PdfReader
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore
from fer import FER
from groq import Groq

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize Firebase if config exists
cred_path = os.getenv("FIREBASE_CRED_PATH", "firebase-key.json")
if os.path.exists(cred_path):
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
else:
    db = None

# Initialize Groq client
client = Groq(api_key=os.getenv("groq_key"))
GROQ_MODEL = os.getenv("groq_model")

# Initialize FER emotion detector
emotion_detector = FER(mtcnn=True)

# Store PDF text globally
docs_text = ""

@app.route("/api/upload-pdf", methods=["POST"])
def upload_pdf():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    # Save PDF temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        file.save(tmp.name)
        reader = PdfReader(tmp.name)
        text = "".join(page.extract_text() for page in reader.pages if page.extract_text())

    global docs_text
    docs_text = text

    if db:
        db.collection("documents").add({"text": text})

    return jsonify({"message": "PDF processed"}), 200

@app.route("/api/detect-emotion", methods=["POST"])
def detect_emotion():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image_file = request.files["image"]
    image_bytes = image_file.read()
    if not image_bytes:
        return jsonify({"error": "Empty image received"}), 400

    # Decode image and detect emotions
    file_bytes = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    if img is None:
        return jsonify({"error": "Invalid image data"}), 400

    results = emotion_detector.detect_emotions(img)
    if not results:
        return jsonify({"error": "No face detected"}), 404

    emotions = results[0]["emotions"]
    detected_emotion = max(emotions, key=emotions.get)

    emotion_map = {
        "happy": "happy",
        "angry": "stressed",
        "sad": "stressed",
        "surprise": "confused",
        "neutral": "neutral",
        "fear": "stressed",
        "disgust": "stressed",
    }
    mapped_emotion = emotion_map.get(detected_emotion, "neutral")

    return jsonify({"emotion": mapped_emotion})

@app.route("/api/ask", methods=["POST"])
def ask():
    data = request.json
    question = data.get("question")
    emotion = data.get("emotion", "neutral")

    if not question or not docs_text:
        return jsonify({"error": "No question or documents available"}), 400

    emotion_prompts = {
        "happy": "Answer enthusiastically and encourage learning.",
        "confused": "Explain clearly and break down concepts.",
        "stressed": "Be patient and reassuring in your answer.",
        "neutral": "Provide a clear and concise answer.",
    }

    prompt = f"""
You are a personal AI tutor helping a student.

Teacher notes:
{docs_text}

Student asked:
{question}

Student's current emotion: {emotion}.

Instruction: {emotion_prompts.get(emotion, emotion_prompts['neutral'])}

Provide a helpful, easy to understand answer:
"""

    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=GROQ_MODEL,
        )
        answer = chat_completion.choices[0].message.content
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    if db:
        db.collection("questions").add({
            "question": question,
            "emotion": emotion,
            "answer": answer,
        })

    return jsonify({"answer": answer})

if __name__ == "__main__":
    # Get the port from the environment (render will set it)
    port = int(os.environ.get("PORT", 10000))

    # Log the port for debugging
    logging.basicConfig(level=logging.INFO)
    logging.info(f"Starting Flask app on port {port}")

    # Run Flask app on 0.0.0.0 to make it accessible to the outside world
    app.run(host="0.0.0.0", port=port)

