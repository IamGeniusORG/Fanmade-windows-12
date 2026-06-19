# Fanmade Windows 12 with J.A.R.V.I.S. AI

Welcome to the Fanmade Windows 12 simulation! This project features a beautiful Windows 12-inspired web desktop environment powered by standard web technologies (HTML/CSS/JS) running on Vite. It includes interactive apps like Task Manager (which automatically detects your real system hardware), File Explorer, Notepad, and a built-in **J.A.R.V.I.S. AI** running completely locally via WebLLM.

## 🚀 Latest Updates

![J.A.R.V.I.S. AI Interface Update](public/banner.png)

Check out the massive new upgrades to the OS architecture:
- **J.A.R.V.I.S. AI Engine**: Upgraded the AI Assistant to a custom J.A.R.V.I.S. persona with a beautiful neon-cyan terminal interface.
- **True Local Inference via WebLLM**: Replaced the external Ollama API with an embedded `@mlc-ai/web-llm` engine. It now downloads and runs the Phi-3 model entirely inside your browser using WebGPU!
- **Context-Aware OS AI Commands**: J.A.R.V.I.S. can now parse natural language and actively manipulate your OS—ask him to open apps, toggle Dark Mode, or change your desktop wallpaper, and he will execute the command!
- **Hardware-Accelerated Fluid Animations**: Re-engineered the window manager with dynamic `transform-origin` calculations so windows smoothly scale down directly into their taskbar icons when minimized, alongside bouncy open/close scale animations.
- **Dynamic Z-Index Stacking**: Click or interact with any window, and it immediately snaps to the absolute front of the UI stack, mimicking true desktop multitasking.
- **Persistent Virtual File System (VFS)**: Creates, saves, and retains documents as a JSON tree structure in `localStorage` across page reloads.
- **Native File System Access**: Integrates modern Web APIs (`showOpenFilePicker`) allowing you to natively import and export `.txt` files directly between your real computer and the web OS.
- **Live Resource Monitoring**: The Task Manager is now wired to your browser's real performance metrics, generating accurate memory charts via `performance.memory` and CPU load simulations via frame-drop tracking.
- **"Mica" Glassmorphism UI Polish**: A gorgeous, authentic Windows 12 aesthetic using a calculated mix of `backdrop-filter: blur(25px)` and alpha channels allowing desktop wallpaper colors to dynamically bleed through the UI.
- **Global Keyboard Shortcuts**: Control the system natively using your keyboard: `Alt + F4` (closes active window), `Ctrl + S` (saves active Notepad file), and `Meta` (toggles the Start Menu).
- **Live Taskbar Hover Previews**: Integrated a microscopic DOM-cloning engine that silently generates live, scaled-down snapshots of your open apps when you hover over them on the taskbar!

## Features

- **Dynamic Task Manager**: Automatically detects and displays your CPU logical processors, system RAM, and GPU model.
- **J.A.R.V.I.S. AI**: A dedicated AI assistant app that communicates directly with your browser's WebGPU.
- **Interactive UI**: Fluid dragging windows, accurate minimize-to-taskbar trajectories, and a sleek, customizable dark/light theme environment.

## Installation & Setup

To run this project on your system, follow these steps:

### 1. Prerequisites
- **Node.js**: Make sure you have Node.js installed on your computer.
- **WebGPU-Enabled Browser**: A modern browser (like Google Chrome or Microsoft Edge) is required to run the WebLLM AI engine locally on your hardware.

### 2. Run the Project
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
