from dotenv import load_dotenv
import os

load_dotenv()

from flask import Flask, jsonify

from backend.routes.admin import admin_bp
from backend.routes.voters import voter_bp
from backend.routes.elections import election_bp
from backend.routes.candidates import candidate_bp
from backend.routes.vote import vote_bp
from backend.routes.auth import auth_bp
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


@app.route("/")
def home():
    return jsonify({"message": "Online Voting Backend Running"})

# Register all blueprints
app.register_blueprint(admin_bp, url_prefix="/api/admin")
app.register_blueprint(voter_bp, url_prefix="/api/voters")
app.register_blueprint(election_bp, url_prefix="/api/elections")
app.register_blueprint(candidate_bp, url_prefix="/api/candidates")
app.register_blueprint(vote_bp, url_prefix="/api/vote")
app.register_blueprint(auth_bp, url_prefix="/api/auth")


# Debug route print
print("\n=== REGISTERED ROUTES ===")
for rule in app.url_map.iter_rules():
    print(rule)
print("========================\n")


if __name__ == "__main__":
    app.run(debug=True)
