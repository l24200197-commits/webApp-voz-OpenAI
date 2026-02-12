const statusBadge = document.getElementById("status");
const commandText = document.getElementById("command");

let active = true;
let silenceTimer;
let OPENAI_KEY = null; // 🔐 aquí se guardará la key

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.lang = "es-MX";
recognition.continuous = true;
recognition.interimResults = false;

// 🚀 Inicializar aplicación
initApp();

async function initApp() {
  await loadApiKey();
  recognition.start();
  updateStatus("ESCUCHANDO", "success");
}

// 🔐 Obtener API key desde MockAPI
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

recognition.onresult = async (event) => {
  resetSilenceTimer();

  const transcript = event.results[event.results.length - 1][0].transcript
    .toLowerCase()
    .trim();

  console.log("🎤", transcript);

  // Wake word
  if (!active && transcript.includes("antonio")) {
    active = true;
    updateStatus("ESCUCHANDO", "success");
    commandText.textContent = "Sistema activado";
    return;
  }

  if (!active) return;

  const command = await sendToOpenAI(transcript);
  commandText.textContent = command;
};

// ⏸️ Suspensión por silencio
function resetSilenceTimer() {
  clearTimeout(silenceTimer);
  silenceTimer = setTimeout(() => {
    active = false;
    updateStatus("SUSPENDIDO", "danger");
    commandText.textContent = "Modo suspendido";
  }, 6000);
}

function updateStatus(text, color) {
  statusBadge.textContent = text;
  statusBadge.className = `badge bg-${color}`;
}

// 🤖 Enviar a OpenAI usando la key dinámica
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
