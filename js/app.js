const statusBadge = document.getElementById("status");
const commandText = document.getElementById("command");

let silenceTimer;
let OPENAI_KEY = null;
let selectedVoice = null;
let isSpeaking = false;
let recognitionActive = false;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.lang = "es-MX";
recognition.continuous = true;
recognition.interimResults = false;

/* ======================================================
   🎙 VOZ
====================================================== */

window.speechSynthesis.onvoiceschanged = () => {
  const voices = speechSynthesis.getVoices();

  selectedVoice = voices.find(v =>
    v.lang.includes("es") &&
    (
      v.name.toLowerCase().includes("jorge") ||
      v.name.toLowerCase().includes("male") ||
      v.name.toLowerCase().includes("mex")
    )
  );

  if (!selectedVoice) {
    selectedVoice = voices.find(v => v.lang.includes("es"));
  }
};

function speak(text) {

  if (recognitionActive) {
    recognition.stop();
  }

  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "es-MX";

  if (selectedVoice) {
    speech.voice = selectedVoice;
  }

  speech.rate = 0.85;
  speech.pitch = 0.6;
  speech.volume = 1;

  isSpeaking = true;

  speech.onend = () => {
    isSpeaking = false;
    safeRestartRecognition();
  };

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(speech);
}

/* ======================================================
   🚀 INICIALIZAR
====================================================== */

initApp();

async function initApp() {
  await loadApiKey();
  safeRestartRecognition();
  updateStatus("ESCUCHANDO", "success");
}

/* ======================================================
   🔐 API KEY
====================================================== */

async function loadApiKey() {
  try {
    const response = await fetch("https://698def62aded595c25309074.mockapi.io/api/v1/apikey");
    const data = await response.json();

    if (data && data.length > 0) {
      OPENAI_KEY = data[0].apikey;
    }
  } catch (error) {
    console.error("Error obteniendo API key:", error);
  }
}

/* ======================================================
   🎙 RECONOCIMIENTO
====================================================== */

recognition.onstart = () => {
  recognitionActive = true;
  console.log("🎤 Micrófono activo");
};

recognition.onend = () => {
  recognitionActive = false;
  console.log("🔁 Reiniciando reconocimiento...");

  if (!isSpeaking) {
    setTimeout(() => {
      safeRestartRecognition();
    }, 300);
  }
};

recognition.onerror = (event) => {
  console.log("⚠ Error reconocimiento:", event.error);

  if (event.error !== "not-allowed") {
    safeRestartRecognition();
  }
};

recognition.onresult = async (event) => {

  const transcript = event.results[event.results.length - 1][0].transcript
    .toLowerCase()
    .trim();

  console.log("🎤", transcript);

  // Presentación
  if (
    transcript.includes("hola antonio") ||
    transcript.includes("quién eres") ||
    transcript.includes("qué haces") ||
    transcript.includes("que haces")
  ) {

    const intro = `
Hola, soy Antonio.
Un asistente de control por voz diseñado para ejecutar comandos específicos.
Puedo avanzar, retroceder, detener,
y realizar giros de noventa o trescientos sesenta grados.
`;

    commandText.textContent = "Presentación del asistente";
    speak(intro);
    return;
  }

  const command = await sendToOpenAI(transcript);
  commandText.textContent = command;

  if (command !== "Orden no reconocida") {
    speak(`Ejecutando comando ${command}`);
  } else {
    speak("Esa orden no la tengo registrada.");
  }
};

function safeRestartRecognition() {
  try {
    recognition.start();
  } catch (e) {
    console.log("Ya estaba iniciado");
  }
}

function updateStatus(text, color) {
  statusBadge.textContent = text;
  statusBadge.className = `badge bg-${color}`;
}

/* ======================================================
   🤖 OPENAI
====================================================== */

async function sendToOpenAI(text) {
  if (!OPENAI_KEY) {
    return "Orden no reconocida";
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
Eres un sistema que interpreta órdenes de movimiento.

Convierte cualquier frase natural en UNO de estos comandos EXACTOS:

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
`
          },
          { role: "user", content: text }
        ],
        temperature: 0
      })
    });

    if (!response.ok) {
      return "Orden no reconocida";
    }

    const data = await response.json();
    const result = data?.choices?.[0]?.message?.content;

    return result ? result.trim() : "Orden no reconocida";

  } catch (error) {
    console.error("Error OpenAI:", error);
    return "Orden no reconocida";
  }
}