const statusBadge = document.getElementById("status");
const commandText = document.getElementById("command");

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
   🎙 CARGAR VOCES CORRECTAMENTE
====================================================== */

function loadVoices() {
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
}

speechSynthesis.onvoiceschanged = loadVoices;

/* ======================================================
   🎤 SPEAK ESTABLE
====================================================== */

function speak(text) {

  if (recognitionActive) {
    recognition.stop();
  }

  const waitForVoices = setInterval(() => {

    const voices = speechSynthesis.getVoices();

    if (voices.length > 0) {

      clearInterval(waitForVoices);
      loadVoices();

      const speech = new SpeechSynthesisUtterance(text);
      speech.lang = "es-MX";

      if (selectedVoice) {
        speech.voice = selectedVoice;
      }

      speech.rate = 0.85;
      speech.pitch = 0.6;

      isSpeaking = true;

      speech.onend = () => {
        isSpeaking = false;
        safeRestartRecognition();
      };

      speechSynthesis.cancel();
      speechSynthesis.speak(speech);
    }

  }, 100);
}

/* ======================================================
   🚀 INICIALIZAR SOLO DESPUÉS DE CLICK
====================================================== */

async function initApp() {

  await loadApiKey();

  try {
    recognition.start();
    recognitionActive = true;
    updateStatus("ESCUCHANDO", "success");
  } catch (e) {
    console.log("Ya iniciado");
  }
}

// 🔥 ESTE ES EL CAMBIO CLAVE
window.addEventListener("click", () => {
  if (!recognitionActive) {
    initApp();
  }
}, { once: true });

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
    console.error("Error API key:", error);
  }
}

/* ======================================================
   🎙 RECONOCIMIENTO
====================================================== */

recognition.onstart = () => {
  recognitionActive = true;
};

recognition.onend = () => {
  recognitionActive = false;

  if (!isSpeaking) {
    setTimeout(() => {
      safeRestartRecognition();
    }, 300);
  }
};

recognition.onerror = (event) => {
  console.log("Error reconocimiento:", event.error);

  if (event.error !== "not-allowed") {
    safeRestartRecognition();
  }
};

recognition.onresult = async (event) => {

  const transcript = event.results[event.results.length - 1][0].transcript
    .toLowerCase()
    .trim();

  console.log("🎤", transcript);

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

    commandText.textContent = "Presentación";
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
    recognitionActive = true;
  } catch (e) {}
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
Convierte la frase en UNO de estos comandos EXACTOS:

avanzar
retroceder
detener
vuelta derecha
vuelta izquierda
90° derecha
90° izquierda
360° derecha
360° izquierda

Si no coincide responde:
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
    return data?.choices?.[0]?.message?.content?.trim() || "Orden no reconocida";

  } catch (error) {
    console.error("Error OpenAI:", error);
    return "Orden no reconocida";
  }
}