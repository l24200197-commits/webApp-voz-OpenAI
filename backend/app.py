from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import os

app = Flask(__name__)
CORS(app)

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

@app.route("/command", methods=["POST"])
def command():
    data = request.get_json()
    text = data.get("text", "")

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": """
Responde SOLO con UNA de estas opciones EXACTAS:

avanzar
retroceder
detener
vuelta derecha
vuelta izquierda
90° derecha
90° izquierda
360° derecha
360° izquierda

Si no coincide, responde:
Orden no reconocida
"""
            },
            {"role": "user", "content": text}
        ],
        temperature=0
    )

    return jsonify({
        "command": response.choices[0].message.content.strip()
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
