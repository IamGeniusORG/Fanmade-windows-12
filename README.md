# Fanmade Windows 12 with Personal AI Assistant

Welcome to the Fanmade Windows 12 simulation! This project features a beautiful Windows 12-inspired web desktop environment powered by standard web technologies (HTML/CSS/JS) running on Vite. It includes interactive apps like Task Manager (which automatically detects your real system hardware), File Explorer, Notepad, and a built-in **Ollama Personal AI Assistant** running completely locally.

## Features

- **Dynamic Task Manager**: Automatically detects and displays your CPU logical processors, system RAM, and GPU model.
- **Ollama AI Assistant**: A dedicated AI assistant app that communicates directly with a local instance of Ollama.
- **Interactive UI**: Dragging windows, minimizing/maximizing, and a sleek, customizable dark/light theme environment.

## Installation & Setup

To run this project on your system, follow these steps:

### 1. Prerequisites
- **Node.js**: Make sure you have Node.js installed on your computer.
- **Ollama**: If you want the Personal AI Assistant to function, install [Ollama](https://ollama.com).

### 2. Configure Ollama for Cross-Origin (CORS)
By default, Ollama only allows requests from specific origins. To let the web browser project communicate with Ollama, you must set an environment variable before running Ollama:

**On Windows (Command Prompt):**
```cmd
set OLLAMA_ORIGINS="*"
ollama run llama3
```

**On Windows (PowerShell):**
```powershell
$env:OLLAMA_ORIGINS="*"
ollama run llama3
```

**On macOS/Linux:**
```bash
OLLAMA_ORIGINS="*" ollama run llama3
```

*(Note: You can replace `llama3` with any model you have downloaded, the assistant will automatically detect available models.)*

### 3. Run the Project
Clone the repository and install the dependencies:

```bash
git clone https://github.com/IamGeniusORG/Fanmade-windows-12.git
cd Fanmade-windows-12
npm install
npm run dev
```

Open the provided localhost link (e.g., `http://localhost:5173`) in your web browser, and enjoy!

## Usage
- Right-click the desktop to open the context menu and launch your AI Assistant instantly.
- Click the Start Menu or taskbar icons to navigate around the OS.
- Open Settings to change themes and system variables.
