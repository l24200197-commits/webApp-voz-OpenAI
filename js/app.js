const statusBadge = document.getElementById("status");
const commandText = document.getElementById("command");

let active = true;
let silenceTimer;
let OPENAI_KEY = null;
let selectedVoice = null;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.lang = "es-MX";
recognition.continuous = true;
recognition.interimResults = false;

/* ======================================================
   🤠 VOZ ESTILO RANCHO
====================================================== */

window.speechSynthesis.onvoiceschanged = () => {
  const voices = speechSynthesis.getVoices();

  // Intentar voz masculina en español
  selectedVoice = voices.find(v =>
    v.lang.includes("es") &&
    (
      v.name.toLowerCase().includes("jorge") ||
      v.name.toLowerCase().includes("male") ||
      v.name.toLowerCase().includes("mex")
    )
  );

  // Si no encuentra masculina, usar cualquier voz en español
  if (!selectedVoice) {
    selectedVoice = voices.find(v => v.lang.includes("es"));
  }

  console.log("🎙 Voz seleccionada:", selectedVoice?.name);
};

function speak(text) {
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "es-MX";

  if (selectedVoice) {
    speech.voice = selectedVoice;
  }

  // Ajustes rancheros
  speech.rate = 0.85;   // más pausado
  speech.pitch = 0.30 // más grave
  speech.volume = 1;

  window.speechSynthesis.speak(speech);
}

/* ======================================================
   🚀 INICIALIZAR
====================================================== */

initApp();

async function initApp() {
  await loadApiKey();
  recognition.start();
  updateStatus("ESCUCHANDO", "success");
}

/* ======================================================
   🔐 CARGAR API KEY
====================================================== */

async function loadApiKey() {
  try {
    const response = await fetch("https://698def62aded595c25309074.mockapi.io/api/v1/apikey");
    const data = await response.json();

    if (data && data.length > 0) {
      OPENAI_KEY = data[0].apikey;
      console.log("🔑 API Key cargada correctamente");
    } else {
      console.error("No se encontró API key");
    }
  } catch (error) {
    console.error("Error obteniendo API key:", error);
  }
}

/* ======================================================
   🎙 RECONOCIMIENTO
====================================================== */

recognition.onresult = async (event) => {

  const transcript = event.results[event.results.length - 1][0].transcript
    .toLowerCase()
    .trim();

  console.log("🎤", transcript);

  resetSilenceTimer();

  // 🔔 Wake word
  if (!active && transcript.includes("sofi")) {
    active = true;
    updateStatus("ESCUCHANDO", "success");
    commandText.textContent = "Sistema activado";
    speak("Sistema activado compadre. Estoy listo para recibir tus órdenes.");
    return;
  }

  if (!active) return;

  // 🤠 Presentación del asistente
  if (
    transcript.includes("hola sofi") ||
    transcript.includes("quién eres") ||
    transcript.includes("que eres") ||
    transcript.includes("qué haces") ||
    transcript.includes("que haces")
  ) {

    const intro = `
Hola, soy sofi.
Un asistente de control por voz diseñado para ejecutar comandos específicos.
Puedo avanzar, retroceder, detener,
y realizar giros de noventa o trescientos sesenta grados.
Para activarme solo pronuncia mi nombre.
Si la orden no es válida,
responderé orden no reconocida.
`;

    commandText.textContent = "Presentación del asistente";
    speak(intro);
    return;
  }

  // 🤖 Procesar comando con OpenAI
  const command = await sendToOpenAI(transcript);
  commandText.textContent = command;

  // 🔊 Respuesta hablada
  if (command !== "Orden no reconocida") {
    speak(`Ejecutando comando ${command}`);
  } else {
    speak("Esa orden no la tengo registrada.");
  }
};

/* ======================================================
   ⏸ SUSPENSIÓN
====================================================== */

function resetSilenceTimer() {
  clearTimeout(silenceTimer);
  silenceTimer = setTimeout(() => {
    active = false;
    updateStatus("SUSPENDIDO", "danger");
    commandText.textContent = "Modo suspendido";
    speak("Entrando en modo suspendido.");
  }, 6000);
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
            `
          },
          { role: "user", content: text }
        ],
        temperature: 0
      })
    });

    if (!response.ok) {
      console.error("Error HTTP:", response.status);
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
