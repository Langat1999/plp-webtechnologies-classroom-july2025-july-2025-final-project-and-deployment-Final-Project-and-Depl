import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import requests
from functools import wraps
import time
from collections import defaultdict

# Support running both as a module and as a script
try:
    from .models import db as models_db, JournalEntry, Flashcard, Recipe
except ImportError:
    from models import db as models_db, JournalEntry, Flashcard, Recipe


load_dotenv()
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "app.db")

app = Flask(__name__)
db_url = os.getenv("MYSQL_URL") or f"sqlite:///{DB_PATH}"
app.config["SQLALCHEMY_DATABASE_URI"] = db_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
CORS(app)
models_db.init_app(app)
db = models_db

# Simple rate limiting
rate_limit_store = defaultdict(list)

def rate_limit(max_calls=10, window=60):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            client_ip = request.remote_addr
            now = time.time()
            rate_limit_store[client_ip] = [t for t in rate_limit_store[client_ip] if now - t < window]
            if len(rate_limit_store[client_ip]) >= max_calls:
                return jsonify({"error": "Rate limit exceeded"}), 429
            rate_limit_store[client_ip].append(now)
            return f(*args, **kwargs)
        return wrapper
    return decorator

@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

@app.route("/api/health", methods=["GET"])
def health():
    return {"status": "ok"}


@app.route("/api/sentiment", methods=["POST"])
@rate_limit(max_calls=5, window=60)  # 5 calls per minute
def sentiment():
    data = request.get_json() or {}
    text = (data.get("text") or "").strip()
    if not text:
        return jsonify({"error": "text is required"}), 400

    # Input validation: limit text length
    if len(text) > 1000:
        return jsonify({"error": "text too long"}), 400

    # Call Hugging Face sentiment model if token provided; fallback to deterministic mock
    hf_token = os.getenv("HUGGINGFACE_TOKEN")
    score = None
    if hf_token:
        try:
            resp = requests.post(
                os.getenv("HUGGINGFACE_MODEL_URL", "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment"),
                headers={"Authorization": f"Bearer {hf_token}"},
                json={"inputs": text},
                timeout=15,
            )
            resp.raise_for_status()
            data_resp = resp.json()
            # Normalize to 0..100 using POSITIVE score when available
            positive = 0.0
            if isinstance(data_resp, list) and data_resp and isinstance(data_resp[0], list):
                for obj in data_resp[0]:
                    if obj.get("label", "").upper().startswith("POS"):
                        positive = float(obj.get("score", 0.0))
                        break
            score = int(round(positive * 100))
        except Exception:
            score = None
    if score is None:
        score = 50 + (hash(text) % 51)
    entry = JournalEntry(text=text, score=score)
    db.session.add(entry)
    db.session.commit()
    return jsonify({"score": score, "id": entry.id, "created_at": entry.created_at.isoformat()})


@app.route("/api/flashcards", methods=["POST"])
@rate_limit(max_calls=3, window=60)  # 3 calls per minute
def flashcards():
    data = request.get_json() or {}
    notes = (data.get("notes") or "").strip()
    if not notes:
        return jsonify({"error": "notes is required"}), 400

    # Input validation: limit notes length
    if len(notes) > 5000:
        return jsonify({"error": "notes too long"}), 400

    seeds = [
        ("What is the main idea?", "Summarize the core concept."),
        ("List two key terms.", "Term A, Term B."),
        ("Why is this important?", "It enables topic X."),
        ("Give one example.", "A concise, real-world example."),
        ("Define an important formula.", "F = m × a"),
    ]
    out = []
    for q, a in seeds:
        card = Flashcard(question=q, answer=a)
        db.session.add(card)
        out.append({"question": q, "answer": a})
    db.session.commit()
    return jsonify({"flashcards": out})


@app.route("/api/recipes", methods=["POST"])
@rate_limit(max_calls=2, window=60)  # 2 calls per minute
def recipes():
    data = request.get_json() or {}
    ingredients = data.get("ingredients") or []
    if not isinstance(ingredients, list) or not ingredients:
        return jsonify({"error": "ingredients[] required"}), 400

    # Input validation: limit number of ingredients and length
    if len(ingredients) > 20:
        return jsonify({"error": "too many ingredients"}), 400

    for ingredient in ingredients:
        if not isinstance(ingredient, str) or len(ingredient.strip()) == 0:
            return jsonify({"error": "invalid ingredient"}), 400
        if len(ingredient) > 100:
            return jsonify({"error": "ingredient too long"}), 400

    ideas = None
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        try:
            # Use Chat Completions for text suggestions
            prompt = (
                "Suggest 3 simple, beginner-friendly recipes using only these ingredients: "
                + ", ".join(ingredients)
                + ". Respond as a JSON array of objects with 'title' and 'content'."
            )
            r = requests.post(
                os.getenv("OPENAI_CHAT_URL", "https://api.openai.com/v1/chat/completions"),
                headers={
                    "Authorization": f"Bearer {openai_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                    "messages": [
                        {"role": "system", "content": "You are a culinary assistant."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.4,
                },
                timeout=20,
            )
            r.raise_for_status()
            comp = r.json()
            content = comp["choices"][0]["message"]["content"]
            try:
                parsed = __import__("json").loads(content)
                ideas = [(x.get("title", "Recipe"), x.get("content", "")) for x in parsed][:3]
            except Exception:
                ideas = None
        except Exception:
            ideas = None
    if ideas is None:
        ideas = [
            ("Quick Bowl", f"Toss {', '.join(ingredients[:3])} with herbs and serve warm."),
            ("One‑Pan Bake", f"Bake {' + '.join(ingredients[:2])} with cheese until golden."),
            ("Skillet Stir‑Fry", f"Stir‑fry {', '.join(ingredients[:3])} with soy sauce and garlic."),
        ]
    out = []
    for title, content in ideas:
        rec = Recipe(title=title, content=content, ingredients=",".join(ingredients))
        db.session.add(rec)
        out.append({"title": title, "content": content})
    db.session.commit()
    return jsonify({"recipes": out})



# Paystack payment initialization route
@app.route("/create-payment", methods=["POST"])
def create_paystack_payment():
    """
    Create a Paystack payment session. This route is called from frontend to initialize payment.
    """
    data = request.get_json() or {}
    amount = data.get("amount")
    email = data.get("email")
    currency = data.get("currency", "KES")  # Default to Kenyan Shilling
    description = data.get("description", "SDG Support Payment")

    if not amount or not isinstance(amount, (int, float)) or amount <= 0:
        return jsonify({"error": "Valid amount is required"}), 400
    if not email:
        return jsonify({"error": "Email is required"}), 400

    paystack_key = os.getenv("PAYSTACK_SECRET_KEY")
    if not paystack_key:
        return jsonify({"error": "Payment service not configured"}), 500

    try:
        url = "https://api.paystack.co/transaction/initialize"
        headers = {
            "Authorization": f"Bearer {paystack_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "amount": int(amount * 100),  # Paystack expects amount in kobo (KES cents)
            "email": email,
            "currency": currency,
            "description": description
        }
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        payment_data = response.json()
        if payment_data.get("status"):
            return jsonify({
                "payment_url": payment_data["data"]["authorization_url"],
                "reference": payment_data["data"]["reference"]
            })
        else:
            return jsonify({"error": payment_data.get("message", "Payment failed")}), 500
    except requests.RequestException as e:
        return jsonify({"error": f"Payment creation failed: {str(e)}"}), 500


def _ensure_db():
    with app.app_context():
        db.create_all()


if __name__ == "__main__":
    _ensure_db()
    app.run(host="0.0.0.0", port=5000, debug=True)


