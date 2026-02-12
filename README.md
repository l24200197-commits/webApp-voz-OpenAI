# 🎙️ WebApp Control por Voz con OpenAI

## 📌 Descripción del Proyecto

Aplicación web desarrollada para el reconocimiento de comandos por voz utilizando la **Web Speech API** y procesamiento inteligente mediante **OpenAI**.

El sistema permite activar el reconocimiento por medio de una palabra clave (wake word), entrar en modo suspendido tras inactividad y reconocer únicamente comandos específicos definidos previamente.

Este proyecto fue desarrollado como implementación práctica de integración entre reconocimiento de voz, procesamiento de lenguaje natural e interfaces web modernas.

---

## 🚀 Características Principales

- 🎙️ Reconocimiento de voz en tiempo real
- 🔔 Activación por palabra clave: **"Alexa" o "Antonio"**
- ⏸️ Suspensión automática por inactividad
- 🤖 Procesamiento de texto mediante OpenAI API
- 🧠 Validación estricta de comandos
- 🎨 Interfaz moderna con Bootstrap 5
- 📱 Diseño responsivo
- 📂 Separación estructurada de archivos (HTML, CSS, JS)

---

## 🧠 Comandos Reconocidos

La IA únicamente puede responder con los siguientes comandos exactos:

- avanzar  
- retroceder  
- detener  
- vuelta derecha  
- vuelta izquierda  
- 90° derecha  
- 90° izquierda  
- 360° derecha  
- 360° izquierda  

Si el texto reconocido no coincide con alguno de los comandos anteriores, el sistema devuelve:

