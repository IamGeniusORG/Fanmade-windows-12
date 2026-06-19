// --- State & Config ---
let zIndexCounter = 100;
let openWindows = {};
let currentTheme = 'dark';
let currentWallpaper = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';
let calcDisplayValue = '0';

// Global Task Manager state
let tmInterval = null;
let cpuData = Array(60).fill(0);
let hwCores = navigator.hardwareConcurrency || 4;
let hwMem = navigator.deviceMemory || 8;

let gpuName = 'Intel(R) UHD Graphics';
try {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      if (renderer) {
         let clean = renderer.replace('ANGLE (', '').split(',')[1] || renderer;
         clean = clean.split('Direct3D')[0].trim();
         gpuName = clean || renderer;
      }
    }
  }
} catch (e) {}

let cpuName = `Generic ${hwCores}-Core Processor`;
if (hwCores >= 24) cpuName = 'Intel(R) Core(TM) i9-13900K / AMD Ryzen 9 7950X';
else if (hwCores >= 16) cpuName = 'Intel(R) Core(TM) i7-13700K / AMD Ryzen 9 5950X';
else if (hwCores >= 12) cpuName = 'Intel(R) Core(TM) i5-13450HX / AMD Ryzen 9 5900X';
else if (hwCores >= 8) cpuName = 'Intel(R) Core(TM) i7-10750H / AMD Ryzen 7 5800X';
else if (hwCores >= 4) cpuName = 'Intel(R) Core(TM) i5-8300H / AMD Ryzen 3 3300X';

// Extremely robust & accurate icons from Icons8 Fluency / Color
const ICON_EXPLORER = 'https://img.icons8.com/fluency/48/folder-invoices--v1.png';
const ICON_EDGE = 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg';
const ICON_JARVIS = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#0a0e17" stroke="#00e5ff" stroke-width="4"/><circle cx="50" cy="50" r="35" fill="none" stroke="#00e5ff" stroke-width="1" stroke-dasharray="8 4"/><text x="50" y="58" font-family="Courier New, monospace" font-size="28" fill="#00e5ff" text-anchor="middle" font-weight="bold">J</text></svg>');
const ICON_STORE = 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Microsoft_Store_Icon_on_Windows_11.svg';
const ICON_NOTEPAD = 'https://img.icons8.com/color/48/notepad.png';
const ICON_PHOTOS = 'https://img.icons8.com/color/48/gallery.png';
const ICON_SETTINGS = 'https://img.icons8.com/color/48/settings--v1.png';
const ICON_TERMINAL = 'https://img.icons8.com/color/48/console.png';
const ICON_CALCULATOR = 'https://img.icons8.com/color/48/calculator--v1.png';
const ICON_TASKMANAGER = 'https://img.icons8.com/fluency/48/task.png';

// --- Global Systems: VFS, Native Files, Shortcuts, Frame Timing ---
window.vfs = JSON.parse(localStorage.getItem('win12_vfs')) || {
  "C:/Users/Admin/Documents": {
    "welcome.txt": "Welcome to Windows 12!\nThis file is stored in your Persistent Virtual File System (localStorage)."
  }
};

window.saveToVFS = () => {
    const ta = document.getElementById('notepad-textarea');
    if(!ta) return;
    const content = ta.value;
    const fileName = prompt("Enter file name to save in Documents:", "document.txt");
    if (!fileName) return;
    if (!window.vfs["C:/Users/Admin/Documents"]) window.vfs["C:/Users/Admin/Documents"] = {};
    window.vfs["C:/Users/Admin/Documents"][fileName] = content;
    localStorage.setItem('win12_vfs', JSON.stringify(window.vfs));
    alert("Saved to Virtual File System!");
    if (openWindows['explorer']) {
       const explorerGrid = openWindows['explorer'].el.querySelector('#explorer-grid');
       if (explorerGrid) explorerGrid.innerHTML = window.renderExplorerFiles();
    }
};

window.importNativeFile = async () => {
    try {
        const [fileHandle] = await window.showOpenFilePicker({
            types: [{ description: 'Text Files', accept: {'text/plain': ['.txt', '.md', '.json', '.js', '.html', '.css']} }]
        });
        const file = await fileHandle.getFile();
        const content = await file.text();
        const ta = document.getElementById('notepad-textarea');
        if (ta) ta.value = content;
    } catch (e) {
        console.log("Import cancelled", e);
    }
};

window.exportNativeFile = async () => {
    try {
        const ta = document.getElementById('notepad-textarea');
        const content = ta ? ta.value : "";
        const fileHandle = await window.showSaveFilePicker({
            suggestedName: 'document.txt',
            types: [{ description: 'Text Files', accept: {'text/plain': ['.txt']} }]
        });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
    } catch (e) {
        console.log("Export cancelled", e);
    }
};

window.renderExplorerFiles = () => {
    let html = '';
    const docs = window.vfs["C:/Users/Admin/Documents"] || {};
    for (const [fileName, content] of Object.entries(docs)) {
        html += `<div class="folder-item" onclick="openNotepadWithFile('${fileName}')"><i class="fa-solid fa-file-lines" style="font-size:32px; color:#00a4ef; margin-bottom:8px;"></i><span style="font-size:12px; text-align:center;">${fileName}</span></div>`;
    }
    return html;
};

window.openNotepadWithFile = (fileName) => {
    const content = window.vfs["C:/Users/Admin/Documents"][fileName] || "";
    if(!openWindows['notepad']) {
        openApp('notepad');
    } else {
        restoreWindow('notepad');
        bringToFront('notepad');
    }
    setTimeout(() => {
        const ta = document.getElementById('notepad-textarea');
        if (ta) ta.value = content;
    }, 100);
};

// Global Keybinds
window.addEventListener('keydown', (e) => {
    // Alt + F4 Close Active Window
    if (e.altKey && e.key === 'F4') {
        e.preventDefault();
        let maxZ = -1; let activeApp = null;
        for (const [appId, appData] of Object.entries(openWindows)) {
            const z = parseInt(appData.el.style.zIndex) || 0;
            if (z > maxZ && !appData.minimized) { maxZ = z; activeApp = appId; }
        }
        if (activeApp) closeAppWindow(activeApp);
    }
    // Ctrl + S Save VFS (if notepad active)
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        let maxZ = -1; let activeApp = null;
        for (const [appId, appData] of Object.entries(openWindows)) {
            const z = parseInt(appData.el.style.zIndex) || 0;
            if (z > maxZ && !appData.minimized) { maxZ = z; activeApp = appId; }
        }
        if (activeApp === 'notepad') window.saveToVFS();
    }
    // Meta/Windows key toggle Start Menu
    if (e.key === 'Meta') {
        e.preventDefault();
        const startMenu = document.getElementById('start-menu');
        if (startMenu.classList.contains('open')) {
            startMenu.classList.remove('open');
        } else {
            startMenu.classList.add('open');
            startMenu.style.zIndex = zIndexCounter++;
        }
    }
});

// Real FPS tracking for Task Manager
let tmLastFrameTime = performance.now();
let tmFrameDurations = [];
function tmMeasureFrame() {
  const now = performance.now();
  tmFrameDurations.push(now - tmLastFrameTime);
  if (tmFrameDurations.length > 60) tmFrameDurations.shift();
  tmLastFrameTime = now;
  requestAnimationFrame(tmMeasureFrame);
}
requestAnimationFrame(tmMeasureFrame);
const apps = {
  explorer: {
    title: 'File Explorer',
    icon: ICON_EXPLORER,
    pinned: true, taskbar: true, desktop: true,
    render: () => `
      <div class="file-explorer">
        <div class="explorer-toolbar">
          <div class="toolbar-actions">
            <div class="toolbar-btn"><i class="fa-solid fa-arrow-left"></i></div>
            <div class="toolbar-btn"><i class="fa-solid fa-arrow-right"></i></div>
            <div class="toolbar-btn"><i class="fa-solid fa-arrow-up"></i></div>
            <div style="width: 1px; height: 20px; background: var(--theme-border); margin: 0 10px;"></div>
            <div class="toolbar-btn" title="New"><i class="fa-solid fa-plus"></i></div>
            <div class="toolbar-btn" title="Cut"><i class="fa-solid fa-scissors"></i></div>
            <div class="toolbar-btn" title="Copy"><i class="fa-solid fa-copy"></i></div>
            <div class="toolbar-btn" title="Paste"><i class="fa-solid fa-paste"></i></div>
          </div>
          <div class="address-bar">
            <i class="fa-solid fa-desktop"></i>
            <span id="explorer-path">This PC > Home</span>
          </div>
          <div class="address-bar" style="max-width: 200px;">
             <i class="fa-solid fa-search" style="opacity:0.5; margin-right:5px;"></i>
             <span style="opacity:0.5;">Search</span>
          </div>
        </div>
        <div class="explorer-body">
          <div class="explorer-sidebar" id="explorer-sidebar">
            <div class="explorer-sidebar-item active" data-path="home"><i class="fa-solid fa-house" style="color:#00a4ef;"></i> Home</div>
            <div class="explorer-sidebar-item" data-path="desktop"><i class="fa-solid fa-desktop" style="color:#ffb900;"></i> Desktop</div>
            <div class="explorer-sidebar-item" data-path="downloads"><i class="fa-solid fa-download" style="color:#7fba00;"></i> Downloads</div>
            <div class="explorer-sidebar-item" data-path="documents"><i class="fa-solid fa-file-lines" style="color:#00a4ef;"></i> Documents</div>
            <div class="explorer-sidebar-item" data-path="pictures"><i class="fa-solid fa-image" style="color:#f25022;"></i> Pictures</div>
            <div class="explorer-sidebar-item" data-path="music"><i class="fa-solid fa-music" style="color:#e81123;"></i> Music</div>
            <div class="explorer-sidebar-item" data-path="videos"><i class="fa-solid fa-film" style="color:#68217a;"></i> Videos</div>
          </div>
          <div class="explorer-main">
            <div class="folder-grid" id="explorer-grid">
              ${window.renderExplorerFiles()}
            </div>
          </div>
        </div>
      </div>
    `
  },
  browser: {
    title: 'J.A.R.V.I.S.',
    icon: ICON_JARVIS,
    pinned: true, taskbar: true, desktop: true,
    render: () => `
      <div style="display:flex; flex-direction:column; height:100%; background:#0a0e17; font-family: 'Courier New', monospace; color:#00e5ff;">
         <div style="padding:20px; display:flex; align-items:center; gap:15px; border-bottom:1px solid rgba(0, 229, 255, 0.2); background:rgba(0, 229, 255, 0.05);">
            <div style="font-size:24px; font-weight:bold; letter-spacing:4px; text-shadow: 0 0 10px rgba(0,229,255,0.5);">J.A.R.V.I.S.</div>
            <div>
               <p style="margin:0; font-size:12px; opacity:0.8; letter-spacing:1px;">Just A Rather Very Intelligent System</p>
            </div>
         </div>
         <div id="edge-chat-container" style="flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:20px; text-shadow: 0 0 5px rgba(0,229,255,0.3);">
            <div style="text-align:center; margin-top:10vh; opacity:0.8;">
               <h1 style="font-size:36px; font-weight:bold; letter-spacing:8px; margin-bottom:10px; text-shadow: 0 0 20px rgba(0,229,255,0.8);">J.A.R.V.I.S.</h1>
               <p style="font-size:14px; letter-spacing:2px; opacity:0.8;">ONLINE AND READY, SIR.</p>
            </div>
         </div>
         <div style="padding:15px 20px; background:#0a0e17; border-top:1px solid rgba(0,229,255,0.2);">
            <div style="display:flex; gap:10px; background:rgba(0,229,255,0.05); padding:5px 5px 5px 15px; border-radius:4px; border:1px solid rgba(0,229,255,0.3); align-items:center; box-shadow: inset 0 0 10px rgba(0,229,255,0.1);">
               <input type="text" id="edge-prompt-input" placeholder="Awaiting command..." style="flex:1; background:transparent; border:none; color:#00e5ff; outline:none; font-size:14px; font-family:'Courier New', monospace; letter-spacing:1px;">
               <button id="edge-send-btn" style="background:rgba(0,229,255,0.2); color:#00e5ff; border:1px solid rgba(0,229,255,0.5); width:40px; height:40px; border-radius:4px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:0.2s;"><i class="fa-solid fa-terminal"></i></button>
            </div>
         </div>
      </div>
    `
  },
  store: {
    title: 'Microsoft Store',
    icon: ICON_STORE,
    pinned: true, taskbar: true, desktop: true,
    render: () => {
      let libraryHtml = '';
      Object.keys(apps).forEach(appId => {
         const app = apps[appId];
         libraryHtml += `
            <div class="store-card">
              <img src="${app.icon}" alt="${app.title}" style="object-fit:contain; background:transparent;">
              <div class="store-card-title">${app.title}</div>
              <div class="store-card-category">System App</div>
              <div class="store-card-action"><span class="price">Installed</span><button style="background:var(--theme-hover); color:var(--theme-text);" onclick="openApp('${appId}')">Open</button></div>
            </div>
         `;
      });
      return `
      <div class="store-app">
        <div class="store-sidebar">
          <div class="store-nav-item active" data-target="store-home"><i class="fa-solid fa-house"></i> Home</div>
          <div class="store-nav-item" data-target="store-apps"><i class="fa-solid fa-layer-group"></i> Apps</div>
          <div class="store-nav-item" data-target="store-gaming"><i class="fa-solid fa-gamepad"></i> Gaming</div>
          <div class="store-nav-item" data-target="store-movies"><i class="fa-solid fa-film"></i> Movies & TV</div>
          <div style="flex:1;"></div>
          <div class="store-nav-item" data-target="store-library"><i class="fa-solid fa-book"></i> Library</div>
          <div class="store-nav-item" data-target="store-settings"><i class="fa-solid fa-gear"></i> Settings</div>
        </div>
        <div class="store-content" style="position:relative;">
          
          <div id="store-home" class="store-page">
            <div class="store-banner">
              <div class="store-banner-content">
                <h1>Essential Apps</h1>
                <p>Everything you need to work, play, and create on your new PC.</p>
                <button>Explore Collection</button>
              </div>
            </div>
            
            <div class="store-section-title">Featured</div>
            <div class="store-grid">
               <div class="store-card"><img src="https://upload.wikimedia.org/wikipedia/commons/9/9a/Visual_Studio_Code_1.35_icon.svg" alt="VS Code"><div class="store-card-title">Visual Studio Code</div><div class="store-card-category">Developer Tools</div><div class="store-card-action"><span class="price">Free</span><button>Get</button></div></div>
               <div class="store-card"><img src="https://img.icons8.com/color/96/minecraft-logo.png" alt="Minecraft"><div class="store-card-title">Minecraft</div><div class="store-card-category">Action & Adventure</div><div class="store-card-action"><span class="price">$29.99</span><button>Buy</button></div></div>
               <div class="store-card"><img src="https://upload.wikimedia.org/wikipedia/commons/0/0c/Netflix_2015_N_logo.svg" alt="Netflix"><div class="store-card-title">Netflix</div><div class="store-card-category">Entertainment</div><div class="store-card-action"><span class="price">Free</span><button>Get</button></div></div>
            </div>
          </div>

          <div id="store-apps" class="store-page" style="display:none;">
            <div class="store-section-title">Top free apps</div>
            <div class="store-grid">
              <div class="store-card"><img src="https://upload.wikimedia.org/wikipedia/commons/9/9a/Visual_Studio_Code_1.35_icon.svg" alt="VS Code"><div class="store-card-title">Visual Studio Code</div><div class="store-card-category">Developer Tools</div><div class="store-card-action"><span class="price">Free</span><button>Get</button></div></div>
              <div class="store-card"><img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp"><div class="store-card-title">WhatsApp</div><div class="store-card-category">Social</div><div class="store-card-action"><span class="price">Free</span><button>Get</button></div></div>
              <div class="store-card"><img src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" alt="Spotify"><div class="store-card-title">Spotify Music</div><div class="store-card-category">Music</div><div class="store-card-action"><span class="price">Free</span><button>Get</button></div></div>
              <div class="store-card"><img src="https://img.icons8.com/fluency/96/tiktok.png" alt="TikTok"><div class="store-card-title">TikTok</div><div class="store-card-category">Entertainment</div><div class="store-card-action"><span class="price">Free</span><button>Get</button></div></div>
              <div class="store-card"><img src="https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg" alt="Figma"><div class="store-card-title">Figma</div><div class="store-card-category">Design</div><div class="store-card-action"><span class="price">Free</span><button>Get</button></div></div>
              <div class="store-card"><img src="https://img.icons8.com/fluency/96/telegram-app.png" alt="Telegram"><div class="store-card-title">Telegram</div><div class="store-card-category">Social</div><div class="store-card-action"><span class="price">Free</span><button>Get</button></div></div>
            </div>
          </div>

          <div id="store-gaming" class="store-page" style="display:none;">
            <div class="store-section-title">Top Games</div>
            <div class="store-grid">
              <div class="store-card"><img src="https://img.icons8.com/color/96/minecraft-logo.png" alt="Minecraft"><div class="store-card-title">Minecraft</div><div class="store-card-category">Action & Adventure</div><div class="store-card-action"><span class="price">$29.99</span><button>Buy</button></div></div>
              <div class="store-card"><img src="https://img.icons8.com/color/96/xbox.png" alt="Xbox"><div class="store-card-title">Xbox</div><div class="store-card-category">Entertainment</div><div class="store-card-action"><span class="price">Free</span><button>Get</button></div></div>
              <div class="store-card"><img src="https://img.icons8.com/color/96/steam.png" alt="Steam"><div class="store-card-title">Steam</div><div class="store-card-category">Gaming Hub</div><div class="store-card-action"><span class="price">Free</span><button>Get</button></div></div>
              <div class="store-card"><img src="https://img.icons8.com/fluency/96/league-of-legends.png" alt="League of Legends"><div class="store-card-title">League of Legends</div><div class="store-card-category">MOBA</div><div class="store-card-action"><span class="price">Free</span><button>Get</button></div></div>
              <div class="store-card"><img src="https://img.icons8.com/color/96/valorant.png" alt="Valorant"><div class="store-card-title">Valorant</div><div class="store-card-category">Shooter</div><div class="store-card-action"><span class="price">Free</span><button>Get</button></div></div>
              <div class="store-card"><img src="https://img.icons8.com/fluency/96/epic-games.png" alt="Epic Games"><div class="store-card-title">Epic Games</div><div class="store-card-category">Gaming Hub</div><div class="store-card-action"><span class="price">Free</span><button>Get</button></div></div>
            </div>
          </div>

          <div id="store-movies" class="store-page" style="display:none;">
            <div class="store-section-title">Movies & TV</div>
            <div class="store-grid">
              <div class="store-card"><img src="https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg" style="object-fit:contain;" alt="Disney+"><div class="store-card-title">Disney+</div><div class="store-card-category">Entertainment</div><div class="store-card-action"><span class="price">Free</span><button>Get</button></div></div>
              <div class="store-card"><img src="https://img.icons8.com/color/96/amazon-prime-video.png" alt="Prime Video"><div class="store-card-title">Amazon Prime Video</div><div class="store-card-category">Entertainment</div><div class="store-card-action"><span class="price">Free</span><button>Get</button></div></div>
              <div class="store-card"><img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Hulu_Logo.svg" style="object-fit:contain;" alt="Hulu"><div class="store-card-title">Hulu</div><div class="store-card-category">Entertainment</div><div class="store-card-action"><span class="price">Free</span><button>Get</button></div></div>
              <div class="store-card"><img src="https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg" style="object-fit:contain;" alt="YouTube"><div class="store-card-title">YouTube</div><div class="store-card-category">Entertainment</div><div class="store-card-action"><span class="price">Free</span><button>Get</button></div></div>
              <div class="store-card"><img src="https://img.icons8.com/color/96/crunchyroll.png" alt="Crunchyroll"><div class="store-card-title">Crunchyroll</div><div class="store-card-category">Entertainment</div><div class="store-card-action"><span class="price">Free</span><button>Get</button></div></div>
              <div class="store-card"><img src="https://upload.wikimedia.org/wikipedia/commons/2/26/Twitch_logo.svg" style="object-fit:contain;" alt="Twitch"><div class="store-card-title">Twitch</div><div class="store-card-category">Entertainment</div><div class="store-card-action"><span class="price">Free</span><button>Get</button></div></div>
            </div>
          </div>

          <div id="store-library" class="store-page" style="display:none;">
            <div class="store-section-title">Library</div>
            <p style="opacity:0.7; margin-bottom:20px; font-size:14px;">Apps and games installed on your system.</p>
            <div class="store-grid">
               ${libraryHtml}
            </div>
          </div>

          <div id="store-settings" class="store-page" style="display:none;">
            <div class="store-section-title">Settings</div>
            <div style="background:var(--theme-hover); border-radius:8px; padding:20px; margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
               <div>
                  <div style="font-weight:600; margin-bottom:5px;">App updates</div>
                  <div style="font-size:13px; opacity:0.7;">Update apps automatically so you don't have to.</div>
               </div>
               <div style="width:40px; height:20px; background:var(--accent); border-radius:10px; position:relative; cursor:pointer;">
                  <div style="width:16px; height:16px; background:#fff; border-radius:50%; position:absolute; right:2px; top:2px;"></div>
               </div>
            </div>
            <div style="background:var(--theme-hover); border-radius:8px; padding:20px; margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
               <div>
                  <div style="font-weight:600; margin-bottom:5px;">Offline permissions</div>
                  <div style="font-size:13px; opacity:0.7;">Make this PC the one I use to run some games or apps that have limited licenses.</div>
               </div>
               <div style="width:40px; height:20px; background:rgba(255,255,255,0.2); border-radius:10px; position:relative; cursor:pointer;">
                  <div style="width:16px; height:16px; background:#fff; border-radius:50%; position:absolute; left:2px; top:2px;"></div>
               </div>
            </div>
            <div style="background:var(--theme-hover); border-radius:8px; padding:20px; display:flex; justify-content:space-between; align-items:center;">
               <div>
                  <div style="font-weight:600; margin-bottom:5px;">About</div>
                  <div style="font-size:13px; opacity:0.7;">Microsoft Store version 22305.1401.1.0</div>
               </div>
            </div>
          </div>

        </div>
      </div>
      `;
    }
  },
  notepad: {
    title: 'Notepad',
    icon: ICON_NOTEPAD,
    pinned: true, taskbar: false, desktop: true,
    render: () => `
      <div style="height: 100%; display: flex; flex-direction: column; background: var(--theme-bg);">
        <div style="padding: 5px 10px; border-bottom: 1px solid var(--theme-border); font-size: 13px; display:flex; gap: 15px;">
           <span style="cursor:pointer;" onclick="window.saveToVFS()">Save (VFS)</span>
           <span style="cursor:pointer;" onclick="window.importNativeFile()">Import File</span>
           <span style="cursor:pointer;" onclick="window.exportNativeFile()">Export File</span>
        </div>
        <textarea id="notepad-textarea" style="flex:1; width:100%; border:none; resize:none; outline:none; padding:10px; background:transparent; color:var(--theme-text); font-family:Consolas, monospace; font-size:14px;" placeholder="Start typing here..."></textarea>
      </div>
    `
  },
  photos: {
    title: 'Photos',
    icon: ICON_PHOTOS,
    pinned: true, taskbar: false, desktop: true,
    render: () => `
      <div class="photos-app">
        <div class="photo-item" style="background-image: url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600');"></div>
        <div class="photo-item" style="background-image: url('https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=600');"></div>
        <div class="photo-item" style="background-image: url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600');"></div>
        <div class="photo-item" style="background-image: url('https://images.unsplash.com/photo-1588694801126-5b32f949c817?q=80&w=600');"></div>
        <div class="photo-item" style="background-image: url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=600');"></div>
      </div>
    `
  },
  settings: {
    title: 'Settings',
    icon: ICON_SETTINGS,
    pinned: true, taskbar: true, desktop: true,
    render: () => `
      <div class="settings-app">
        <div class="settings-sidebar" id="settings-sidebar">
          <div class="settings-user">
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png" alt="User">
            <div class="settings-user-info">
              <h3>Admin</h3>
              <p>Local Account</p>
            </div>
          </div>
          <div class="settings-nav-item active" data-setting="system"><i class="fa-solid fa-laptop"></i> System</div>
          <div class="settings-nav-item" data-setting="personalization"><i class="fa-solid fa-paint-roller"></i> Personalization</div>
          <div class="settings-nav-item" data-setting="network"><i class="fa-solid fa-wifi"></i> Network & Internet</div>
          <div class="settings-nav-item" data-setting="apps"><i class="fa-solid fa-grip"></i> Apps</div>
          <div class="settings-nav-item" data-setting="accounts"><i class="fa-solid fa-user"></i> Accounts</div>
          <div class="settings-nav-item" data-setting="update"><i class="fa-solid fa-rotate"></i> Windows Update</div>
        </div>
        <div class="settings-main" id="settings-content">
          <div class="settings-header">System</div>
          <div class="settings-card" style="display:block;">
            <div class="settings-card-info" style="margin-bottom:10px;">
              <h4>Display Brightness</h4>
              <p>Adjust the brightness of your simulated display</p>
            </div>
            <input type="range" id="brightness-slider" min="30" max="100" value="100">
          </div>
          <div class="settings-card" style="display:block;">
            <div class="settings-card-info" style="margin-bottom:10px;">
              <h4>Volume</h4>
              <p>System volume control</p>
            </div>
            <input type="range" id="volume-slider" min="0" max="100" value="50">
          </div>
        </div>
      </div>
    `
  },
  taskmanager: {
    title: 'Task Manager',
    icon: ICON_TASKMANAGER,
    pinned: true, taskbar: false, desktop: true,
    render: () => `
      <div class="tm-container">
         <div class="tm-sidebar">
            <div class="tm-sidebar-icon" title="Processes"><i class="fa-solid fa-list"></i></div>
            <div class="tm-sidebar-icon active" title="Performance"><i class="fa-solid fa-chart-line"></i></div>
            <div class="tm-sidebar-icon" title="App history"><i class="fa-solid fa-clock-rotate-left"></i></div>
            <div class="tm-sidebar-icon" title="Startup apps"><i class="fa-solid fa-gauge-high"></i></div>
         </div>
         <div class="tm-content" id="tm-perf-view">
            <div class="tm-perf-sidebar">
               <div class="tm-perf-item active">
                  <div class="tm-perf-item-title">CPU</div>
                  <div class="tm-perf-item-sub" id="tm-cpu-sub">...</div>
               </div>
               <div class="tm-perf-item">
                  <div class="tm-perf-item-title">Memory</div>
                  <div class="tm-perf-item-sub" id="tm-mem-sub">4.2/${hwMem}.0 GB</div>
               </div>
               <div class="tm-perf-item">
                  <div class="tm-perf-item-title">Disk 0 (C:)</div>
                  <div class="tm-perf-item-sub" id="tm-disk-sub">0% SSD</div>
               </div>
               <div class="tm-perf-item">
                  <div class="tm-perf-item-title">Wi-Fi</div>
                  <div class="tm-perf-item-sub">Sending: 0 Kbps</div>
               </div>
               <div class="tm-perf-item">
                  <div class="tm-perf-item-title">GPU 0</div>
                  <div class="tm-perf-item-sub" style="font-size:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${gpuName}">${gpuName}</div>
               </div>
            </div>
            <div class="tm-perf-main">
               <h2 style="font-size:24px; font-weight:500;">CPU</h2>
               <p style="font-size:13px; opacity:0.8; margin-top:2px;">${cpuName}</p>
               <div style="font-size:12px; margin-top:15px; opacity:0.8;">% Utilization over 60 seconds</div>
               <div class="tm-graph-container">
                  <canvas id="tm-cpu-canvas" class="tm-graph-canvas"></canvas>
               </div>
               <div class="tm-info-grid">
                  <div class="tm-info-box"><span class="tm-info-label">Utilization</span><span class="tm-info-val" id="tm-cpu-util">...</span></div>
                  <div class="tm-info-box"><span class="tm-info-label">Speed</span><span class="tm-info-val" id="tm-cpu-speed">...</span></div>
                  <div class="tm-info-box"><span class="tm-info-label">Processes</span><span class="tm-info-val" id="tm-cpu-procs">243</span></div>
                  <div class="tm-info-box"><span class="tm-info-label">Threads</span><span class="tm-info-val" id="tm-cpu-threads">3120</span></div>
                  <div class="tm-info-box"><span class="tm-info-label">Handles</span><span class="tm-info-val">98124</span></div>
                  <div class="tm-info-box"><span class="tm-info-label">Up time</span><span class="tm-info-val" id="tm-cpu-uptime">0:01:24:15</span></div>
                  <div class="tm-info-box"><span class="tm-info-label">Logical processors</span><span class="tm-info-val">${hwCores}</span></div>
               </div>
            </div>
         </div>
      </div>
    `
  },
  calculator: {
    title: 'Calculator',
    icon: ICON_CALCULATOR,
    pinned: true, taskbar: false, desktop: true,
    render: () => `
      <div style="height: 100%; display:flex; flex-direction:column; background: var(--theme-bg);">
         <div id="calc-display" style="padding: 20px; font-size: 32px; text-align:right; border-bottom: 1px solid var(--theme-border);">0</div>
         <div style="flex: 1; display:grid; grid-template-columns: repeat(4, 1fr); gap:2px; padding:2px; background: var(--theme-border);">
            <div class="calc-btn" data-val="C">C</div>
            <div class="calc-btn" data-val="C">CE</div>
            <div class="calc-btn" data-val="DEL"><i class="fa-solid fa-delete-left"></i></div>
            <div class="calc-btn" data-val="/">÷</div>
            <div class="calc-btn" data-val="7">7</div>
            <div class="calc-btn" data-val="8">8</div>
            <div class="calc-btn" data-val="9">9</div>
            <div class="calc-btn" data-val="*">×</div>
            <div class="calc-btn" data-val="4">4</div>
            <div class="calc-btn" data-val="5">5</div>
            <div class="calc-btn" data-val="6">6</div>
            <div class="calc-btn" data-val="-">-</div>
            <div class="calc-btn" data-val="1">1</div>
            <div class="calc-btn" data-val="2">2</div>
            <div class="calc-btn" data-val="3">3</div>
            <div class="calc-btn" data-val="+">+</div>
            <div class="calc-btn" data-val="±">±</div>
            <div class="calc-btn" data-val="0">0</div>
            <div class="calc-btn" data-val=".">.</div>
            <div class="calc-btn" data-val="=" style="background:var(--accent); color:#fff;">=</div>
         </div>
      </div>
    `
  }
};

// --- DOM Elements ---
const bootScreen = document.getElementById('boot-screen');
const desktop = document.getElementById('desktop');
const desktopIconsContainer = document.getElementById('desktop-icons');
const taskbarIconsContainer = document.getElementById('taskbar-icons');
const pinnedAppsContainer = document.getElementById('pinned-apps');

const startBtn = document.getElementById('start-btn');
const startMenu = document.getElementById('start-menu');
const timeEl = document.getElementById('time');
const dateEl = document.getElementById('date');
const windowsContainer = document.getElementById('windows-container');

// --- Initialization: Render UI ---
function initializeUI() {
  desktopIconsContainer.innerHTML = '';
  taskbarIconsContainer.innerHTML = '';
  pinnedAppsContainer.innerHTML = '';

  Object.keys(apps).forEach(appId => {
    const app = apps[appId];

    if (app.desktop) {
      desktopIconsContainer.innerHTML += `
        <div class="desktop-icon" data-app="${appId}">
          <img src="${app.icon}" alt="${app.title}" class="icon-img" onerror="this.src='https://img.icons8.com/color/48/mac-folder.png'">
          <span class="icon-text">${app.title}</span>
        </div>
      `;
    }

    if (app.taskbar) {
      taskbarIconsContainer.innerHTML += `
        <div class="taskbar-icon" data-app="${appId}" title="${app.title}">
           <img src="${app.icon}" alt="${app.title}" onerror="this.src='https://img.icons8.com/color/48/mac-folder.png'">
        </div>
      `;
    }

    if (app.pinned) {
      pinnedAppsContainer.innerHTML += `
        <div class="pinned-app" data-app="${appId}">
          <img src="${app.icon}" alt="${app.title}" onerror="this.src='https://img.icons8.com/color/48/mac-folder.png'">
          <span>${app.title}</span>
        </div>
      `;
    }
  });

  // Taskbar Hover Previews
  document.querySelectorAll('.taskbar-icon').forEach(icon => {
      let preview = document.createElement('div');
      preview.className = 'taskbar-preview';
      preview.style.cssText = 'position:absolute; bottom:60px; left:50%; transform:translateX(-50%); width:200px; height:125px; background:rgba(20,20,20,0.9); border-radius:8px; border:1px solid rgba(255,255,255,0.1); display:none; align-items:center; justify-content:center; overflow:hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index:10000; pointer-events:none;';
      icon.appendChild(preview);
      
      icon.addEventListener('mouseenter', async () => {
          const appId = icon.getAttribute('data-app');
          if (openWindows[appId] && !openWindows[appId].minimized && window.html2canvas) {
              preview.style.display = 'flex';
              const canvas = await html2canvas(openWindows[appId].el, { scale: 0.25, backgroundColor: null });
              preview.innerHTML = '';
              preview.appendChild(canvas);
          }
      });
      icon.addEventListener('mouseleave', () => {
          preview.style.display = 'none';
      });
  });
}
initializeUI();

// --- Boot Sequence ---
setTimeout(() => {
  bootScreen.style.opacity = '0';
  setTimeout(() => {
    bootScreen.style.display = 'none';
    desktop.classList.remove('hidden');
  }, 500);
}, 2000);

// --- Clock ---
function updateClock() {
  const now = new Date();
  timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  dateEl.textContent = now.toLocaleDateString();
}
setInterval(updateClock, 1000);
updateClock();

// --- Context Menu & Selection ---
let currentContextMenu = null;

function openContextMenu(x, y, type) {
  if (currentContextMenu) currentContextMenu.remove();
  
  const menu = document.createElement('div');
  menu.className = 'context-menu open';
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  
  if (type === 'desktop') {
    menu.innerHTML = `
      <div class="context-item"><i class="fa-solid fa-table-cells-large"></i> View</div>
      <div class="context-item"><i class="fa-solid fa-arrow-down-a-z"></i> Sort by</div>
      <div class="context-item" id="refresh-desktop"><i class="fa-solid fa-rotate-right"></i> Refresh</div>
      <div class="context-divider"></div>
      <div class="context-item" data-app="browser"><i class="fa-solid fa-robot"></i> Ask AI Assistant</div>
      <div class="context-item" data-app="notepad"><i class="fa-solid fa-file-lines"></i> New Document</div>
      <div class="context-divider"></div>
      <div class="context-item" data-app="settings"><i class="fa-solid fa-display"></i> Display settings</div>
      <div class="context-item" data-app="settings"><i class="fa-solid fa-paint-roller"></i> Personalize</div>
    `;
  } else if (type === 'taskbar') {
    // Offset upwards if menu is near bottom
    menu.style.top = (y - 80) + 'px';
    menu.innerHTML = `
      <div class="context-item" data-app="settings"><i class="fa-solid fa-gear"></i> Taskbar settings</div>
      <div class="context-item" data-app="taskmanager"><i class="fa-solid fa-chart-line"></i> Task Manager</div>
    `;
  }
  
  document.body.appendChild(menu);
  currentContextMenu = menu;
}

desktop.addEventListener('contextmenu', (e) => {
  if (e.target.closest('.app-window') || e.target.closest('.start-menu') || e.target.closest('.context-menu')) return;
  e.preventDefault();
  if (e.target.closest('.taskbar')) {
    openContextMenu(e.clientX, e.clientY, 'taskbar');
  } else {
    openContextMenu(e.clientX, e.clientY, 'desktop');
  }
  startMenu.classList.remove('open');
});

let isDesktopSelecting = false;
let selectionBox = null;
let selStartX = 0, selStartY = 0;

desktop.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return; 
  if (e.target === desktop || e.target === desktopIconsContainer) {
    isDesktopSelecting = true;
    selStartX = e.clientX;
    selStartY = e.clientY;
    
    selectionBox = document.createElement('div');
    selectionBox.className = 'desktop-selection';
    selectionBox.style.left = selStartX + 'px';
    selectionBox.style.top = selStartY + 'px';
    desktop.appendChild(selectionBox);
    
    if(currentContextMenu) {
      currentContextMenu.remove();
      currentContextMenu = null;
    }
    startMenu.classList.remove('open');
  }
});

document.addEventListener('mousemove', (e) => {
  if (isDesktopSelecting && selectionBox) {
    const currentX = e.clientX;
    const currentY = e.clientY;
    const width = Math.abs(currentX - selStartX);
    const height = Math.abs(currentY - selStartY);
    const left = Math.min(currentX, selStartX);
    const top = Math.min(currentY, selStartY);
    
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
  }
});

document.addEventListener('mouseup', () => {
  if (isDesktopSelecting) {
    isDesktopSelecting = false;
    if (selectionBox) {
       selectionBox.remove();
       selectionBox = null;
    }
  }
});

// --- App Input Listeners ---
document.addEventListener('input', (e) => {
  if (e.target.id === 'brightness-slider') {
    const val = e.target.value;
    document.body.style.filter = `brightness(${val}%)`;
  }
});

// --- Task Manager Graph Logic ---
function startTaskManager() {
  const canvas = document.getElementById('tm-cpu-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  tmInterval = setInterval(() => {
     let avgFrame = tmFrameDurations.reduce((a,b)=>a+b,0) / Math.max(1, tmFrameDurations.length);
     let cpuLoad = Math.min(100, Math.max(2, ((avgFrame - 16.6) / 16.6) * 100));
     let nextVal = isNaN(cpuLoad) ? 5 : cpuLoad;
     
     let memLoadStr = "4.2";
     if (performance.memory) {
         let usedMB = performance.memory.usedJSHeapSize / (1024 * 1024);
         memLoadStr = (usedMB / 10).toFixed(1); // Scale for aesthetic realism
     }

     cpuData.shift();
     cpuData.push(nextVal);

     const utilEl = document.getElementById('tm-cpu-util');
     const subEl = document.getElementById('tm-cpu-sub');
     const speedEl = document.getElementById('tm-cpu-speed');
     const memEl = document.getElementById('tm-mem-sub');
     if(utilEl) utilEl.textContent = Math.round(nextVal) + '%';
     if(subEl) subEl.textContent = Math.round(nextVal) + '% ' + (cpuName.length > 15 ? cpuName.substring(0,15) + '...' : cpuName);
     if(speedEl) speedEl.textContent = (2.5 + (nextVal/100)*2).toFixed(2) + ' GHz';
     if(memEl) memEl.textContent = memLoadStr + '/' + hwMem + '.0 GB';

     ctx.clearRect(0, 0, canvas.width, canvas.height);
     
     // Fill
     ctx.beginPath();
     ctx.moveTo(0, canvas.height);
     const stepX = canvas.width / (cpuData.length - 1);
     for(let i=0; i<cpuData.length; i++) {
        const x = i * stepX;
        const y = canvas.height - (cpuData[i] / 100 * canvas.height);
        ctx.lineTo(x, y);
     }
     ctx.lineTo(canvas.width, canvas.height);
     ctx.fillStyle = 'rgba(0, 103, 192, 0.15)';
     ctx.fill();
     
     // Stroke
     ctx.beginPath();
     for(let i=0; i<cpuData.length; i++) {
        const x = i * stepX;
        const y = canvas.height - (cpuData[i] / 100 * canvas.height);
        if(i===0) ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
     }
     ctx.strokeStyle = '#0067c0';
     ctx.lineWidth = 1.5;
     ctx.stroke();

  }, 1000);
}

function stopTaskManager() {
  if(tmInterval) {
    clearInterval(tmInterval);
    tmInterval = null;
  }
}

// --- Global Click Handlers ---
startBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  startMenu.classList.toggle('open');
  if(currentContextMenu) currentContextMenu.remove();
});

document.addEventListener('click', (e) => {
  // Hide menus
  if (!startMenu.contains(e.target) && !startBtn.contains(e.target)) {
    startMenu.classList.remove('open');
  }
  
  if (currentContextMenu && !currentContextMenu.contains(e.target)) {
     currentContextMenu.remove();
     currentContextMenu = null;
  }

  // Refresh Desktop
  if (e.target.closest('#refresh-desktop')) {
     const icons = document.getElementById('desktop-icons');
     icons.style.opacity = '0';
     setTimeout(() => { icons.style.opacity = '1'; }, 150);
     if (currentContextMenu) currentContextMenu.remove();
     currentContextMenu = null;
     return; // stop execution
  }

  // App Launching
  const appBtn = e.target.closest('[data-app]');
  if (appBtn) {
    const appId = appBtn.getAttribute('data-app');
    
    if (appBtn.classList.contains('taskbar-icon')) {
      if(openWindows[appId]) {
          if(openWindows[appId].minimized) {
              restoreWindow(appId);
          } else if (openWindows[appId].el.style.zIndex == zIndexCounter) {
              minimizeWindow(appId);
          } else {
              bringToFront(appId);
          }
      } else {
          openApp(appId);
      }
    } else {
      openApp(appId);
      startMenu.classList.remove('open');
      if (currentContextMenu) currentContextMenu.remove();
    }
  }

  // Settings Functionality
  if (e.target.closest('#theme-toggle')) {
    const toggle = e.target.closest('#theme-toggle');
    if (currentTheme === 'dark') {
      currentTheme = 'light';
      document.body.classList.add('light-mode');
      toggle.classList.remove('on');
    } else {
      currentTheme = 'dark';
      document.body.classList.remove('light-mode');
      toggle.classList.add('on');
    }
  }

  if (e.target.closest('.wallpaper-thumb')) {
    const thumb = e.target.closest('.wallpaper-thumb');
    currentWallpaper = thumb.getAttribute('data-wp');
    desktop.style.backgroundImage = `url('${currentWallpaper}')`;
  }

  if (e.target.closest('.settings-nav-item')) {
    const navItem = e.target.closest('.settings-nav-item');
    const setting = navItem.getAttribute('data-setting');
    const sidebar = navItem.parentElement;
    
    sidebar.querySelectorAll('.settings-nav-item').forEach(el => el.classList.remove('active'));
    navItem.classList.add('active');

    const contentArea = sidebar.nextElementSibling;
    if(setting === 'system') {
      contentArea.innerHTML = `
        <div class="settings-header">System</div>
        <div class="settings-card" style="display:block;">
          <div class="settings-card-info" style="margin-bottom:10px;">
            <h4>Display Brightness</h4>
            <p>Adjust the brightness of your simulated display</p>
          </div>
          <input type="range" id="brightness-slider" min="30" max="100" value="100">
        </div>
        <div class="settings-card" style="display:block;">
          <div class="settings-card-info" style="margin-bottom:10px;">
            <h4>Volume</h4>
            <p>System volume control</p>
          </div>
          <input type="range" id="volume-slider" min="0" max="100" value="50">
        </div>
      `;
    } else if (setting === 'personalization') {
      contentArea.innerHTML = `
        <div class="settings-header">Personalization</div>
        <div class="settings-card">
          <div class="settings-card-info"><h4>Theme</h4><p>Choose your default app mode</p></div>
          <div class="toggle-switch ${currentTheme === 'dark' ? 'on' : ''}" id="theme-toggle"></div>
        </div>
        <div class="settings-card" style="display:block;">
          <div class="settings-card-info"><h4>Background</h4><p>Personalize your background</p></div>
          <div class="wallpaper-grid">
            <div class="wallpaper-thumb" data-wp="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" style="background-image: url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')"></div>
            <div class="wallpaper-thumb" data-wp="https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=2564&auto=format&fit=crop" style="background-image: url('https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=2564&auto=format&fit=crop')"></div>
            <div class="wallpaper-thumb" data-wp="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2564&auto=format&fit=crop" style="background-image: url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2564&auto=format&fit=crop')"></div>
            <div class="wallpaper-thumb" data-wp="https://images.unsplash.com/photo-1588694801126-5b32f949c817?q=80&w=2564&auto=format&fit=crop" style="background-image: url('https://images.unsplash.com/photo-1588694801126-5b32f949c817?q=80&w=2564&auto=format&fit=crop')"></div>
            <div class="wallpaper-thumb" data-wp="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2564&auto=format&fit=crop" style="background-image: url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2564&auto=format&fit=crop')"></div>
          </div>
        </div>
      `;
    } else {
      contentArea.innerHTML = `<div class="settings-header">Coming Soon</div><p>This section is under development.</p>`;
    }
  }

  // File Explorer Functionality
  if (e.target.closest('.explorer-sidebar-item')) {
    const navItem = e.target.closest('.explorer-sidebar-item');
    const path = navItem.getAttribute('data-path');
    const sidebar = navItem.parentElement;
    
    sidebar.querySelectorAll('.explorer-sidebar-item').forEach(el => el.classList.remove('active'));
    navItem.classList.add('active');

    const explorer = navItem.closest('.file-explorer');
    const grid = explorer.querySelector('.folder-grid');
    const pathEl = explorer.querySelector('#explorer-path');

    let newHTML = '';
    
    if(path === 'home') {
      pathEl.textContent = 'This PC > Home';
      newHTML = `
        <div class="folder-item" data-app="explorer"><img src="${ICON_EXPLORER}"><span>Projects</span></div>
        <div class="folder-item" data-app="explorer"><img src="${ICON_EXPLORER}"><span>Work</span></div>
        <div class="folder-item" data-app="explorer"><img src="${ICON_EXPLORER}"><span>Personal</span></div>
      `;
    } else if (path === 'desktop') {
      pathEl.textContent = 'This PC > Desktop';
      newHTML = `
        <div class="folder-item" data-app="browser"><img src="${ICON_EDGE}"><span>Edge.lnk</span></div>
        <div class="folder-item" data-app="settings"><img src="${ICON_SETTINGS}"><span>Settings.lnk</span></div>
        <div class="folder-item" data-app="notepad"><img src="${ICON_NOTEPAD}"><span>Notepad.lnk</span></div>
        <div class="folder-item" data-app="taskmanager"><img src="${ICON_TASKMANAGER}"><span>Task Manager.lnk</span></div>
      `;
    } else if (path === 'downloads') {
      pathEl.textContent = 'This PC > Downloads';
      newHTML = `
        <div class="folder-item"><i class="fa-solid fa-file-pdf" style="font-size: 32px; margin-bottom: 8px; color: #ff3b3b;"></i><span>Invoice.pdf</span></div>
        <div class="folder-item"><i class="fa-solid fa-file-image" style="font-size: 32px; margin-bottom: 8px; color: #3b82f6;"></i><span>image_001.png</span></div>
      `;
    } else if (path === 'pictures') {
      pathEl.textContent = 'This PC > Pictures';
      newHTML = `
        <div class="folder-item" data-app="photos"><img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150" style="border-radius:4px; object-fit:cover;"><span>Wallpaper1</span></div>
        <div class="folder-item" data-app="photos"><img src="https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=150" style="border-radius:4px; object-fit:cover;"><span>Wallpaper2</span></div>
      `;
    } else {
      pathEl.textContent = 'This PC > ' + path;
      newHTML = `<p style="padding:10px;">This folder is empty.</p>`;
    }
    grid.innerHTML = newHTML;
  }

  // Calculator Functionality
  if (e.target.closest('.calc-btn')) {
    const btn = e.target.closest('.calc-btn');
    const val = btn.getAttribute('data-val');
    const display = e.target.closest('.app-window').querySelector('#calc-display');
    if (!display) return;

    if (val === 'C' || val === 'CE') {
      calcDisplayValue = '0';
    } else if (val === 'DEL') {
      calcDisplayValue = calcDisplayValue.slice(0, -1) || '0';
    } else if (val === '=') {
      try {
        calcDisplayValue = String(eval(calcDisplayValue.replace(/÷/g, '/').replace(/×/g, '*')));
      } catch (err) {
        calcDisplayValue = 'Error';
      }
    } else {
      if (calcDisplayValue === '0' || calcDisplayValue === 'Error') {
        calcDisplayValue = val;
      } else {
        calcDisplayValue += val;
      }
    }
    display.textContent = calcDisplayValue;
  }

  // Task Manager UI logic
  if (e.target.closest('.tm-perf-item')) {
    const item = e.target.closest('.tm-perf-item');
    const titleEl = item.querySelector('.tm-perf-item-title');
    if (!titleEl) return;
    const type = titleEl.textContent.trim();

    const sidebar = item.parentElement;
    sidebar.querySelectorAll('.tm-perf-item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');

    const mainPanel = item.closest('.tm-content').querySelector('.tm-perf-main');
    
    if (type === 'CPU') {
      mainPanel.innerHTML = `
         <h2 style="font-size:24px; font-weight:500;">CPU</h2>
         <p style="font-size:13px; opacity:0.8; margin-top:2px;">${cpuName}</p>
         <div style="font-size:12px; margin-top:15px; opacity:0.8;">% Utilization over 60 seconds</div>
         <div class="tm-graph-container">
            <canvas id="tm-cpu-canvas" class="tm-graph-canvas"></canvas>
         </div>
         <div class="tm-info-grid">
            <div class="tm-info-box"><span class="tm-info-label">Utilization</span><span class="tm-info-val" id="tm-cpu-util">...</span></div>
            <div class="tm-info-box"><span class="tm-info-label">Speed</span><span class="tm-info-val" id="tm-cpu-speed">...</span></div>
            <div class="tm-info-box"><span class="tm-info-label">Processes</span><span class="tm-info-val" id="tm-cpu-procs">243</span></div>
            <div class="tm-info-box"><span class="tm-info-label">Threads</span><span class="tm-info-val" id="tm-cpu-threads">3120</span></div>
            <div class="tm-info-box"><span class="tm-info-label">Handles</span><span class="tm-info-val">98124</span></div>
            <div class="tm-info-box"><span class="tm-info-label">Up time</span><span class="tm-info-val" id="tm-cpu-uptime">0:01:24:15</span></div>
            <div class="tm-info-box"><span class="tm-info-label">Logical processors</span><span class="tm-info-val">${hwCores}</span></div>
         </div>
      `;
      stopTaskManager();
      startTaskManager();
    } else if (type === 'Memory') {
      mainPanel.innerHTML = `
         <h2 style="font-size:24px; font-weight:500;">Memory</h2>
         <p style="font-size:13px; opacity:0.8; margin-top:2px;">${hwMem}.0 GB DDR4</p>
         <div style="font-size:12px; margin-top:15px; opacity:0.8;">Memory usage</div>
         <div class="tm-graph-container" style="background:rgba(139, 92, 246, 0.1); border:1px solid #8b5cf6;">
         </div>
         <div class="tm-info-grid" style="margin-top:20px;">
            <div class="tm-info-box"><span class="tm-info-label">In use (Compressed)</span><span class="tm-info-val">4.2 GB (0 MB)</span></div>
            <div class="tm-info-box"><span class="tm-info-label">Available</span><span class="tm-info-val">${(hwMem > 4.2 ? (hwMem - 4.2).toFixed(1) : 0)} GB</span></div>
            <div class="tm-info-box"><span class="tm-info-label">Committed</span><span class="tm-info-val">5.1/${hwMem + 2}.0 GB</span></div>
            <div class="tm-info-box"><span class="tm-info-label">Cached</span><span class="tm-info-val">2.1 GB</span></div>
            <div class="tm-info-box"><span class="tm-info-label">Paged pool</span><span class="tm-info-val">420 MB</span></div>
            <div class="tm-info-box"><span class="tm-info-label">Non-paged pool</span><span class="tm-info-val">210 MB</span></div>
         </div>
      `;
      stopTaskManager();
    } else if (type === 'Disk 0 (C:)') {
      mainPanel.innerHTML = `
         <h2 style="font-size:24px; font-weight:500;">Disk 0 (C:)</h2>
         <p style="font-size:13px; opacity:0.8; margin-top:2px;">NVMe SSD</p>
         <div style="font-size:12px; margin-top:15px; opacity:0.8;">Active time</div>
         <div class="tm-graph-container" style="background:rgba(16, 185, 129, 0.1); border:1px solid #10b981;">
         </div>
         <div class="tm-info-grid" style="margin-top:20px;">
            <div class="tm-info-box"><span class="tm-info-label">Active time</span><span class="tm-info-val">0%</span></div>
            <div class="tm-info-box"><span class="tm-info-label">Average response time</span><span class="tm-info-val">0.1 ms</span></div>
            <div class="tm-info-box"><span class="tm-info-label">Read speed</span><span class="tm-info-val">0 KB/s</span></div>
            <div class="tm-info-box"><span class="tm-info-label">Write speed</span><span class="tm-info-val">0 KB/s</span></div>
            <div class="tm-info-box"><span class="tm-info-label">Capacity</span><span class="tm-info-val">953 GB</span></div>
            <div class="tm-info-box"><span class="tm-info-label">Formatted</span><span class="tm-info-val">953 GB</span></div>
         </div>
      `;
      stopTaskManager();
    } else if (type === 'Wi-Fi') {
      mainPanel.innerHTML = `
         <h2 style="font-size:24px; font-weight:500;">Wi-Fi</h2>
         <p style="font-size:13px; opacity:0.8; margin-top:2px;">Intel(R) Wi-Fi 6 AX201 160MHz</p>
         <div style="font-size:12px; margin-top:15px; opacity:0.8;">Throughput</div>
         <div class="tm-graph-container" style="background:rgba(239, 68, 68, 0.1); border:1px solid #ef4444;">
         </div>
         <div class="tm-info-grid" style="margin-top:20px;">
            <div class="tm-info-box"><span class="tm-info-label">Send</span><span class="tm-info-val">0 Kbps</span></div>
            <div class="tm-info-box"><span class="tm-info-label">Receive</span><span class="tm-info-val">0 Kbps</span></div>
            <div class="tm-info-box"><span class="tm-info-label">IPv4 address</span><span class="tm-info-val">192.168.1.10</span></div>
            <div class="tm-info-box"><span class="tm-info-label">IPv6 address</span><span class="tm-info-val">fe80::1</span></div>
            <div class="tm-info-box"><span class="tm-info-label">Signal strength</span><span class="tm-info-val">Excellent</span></div>
         </div>
      `;
      stopTaskManager();
    } else if (type === 'GPU 0') {
      mainPanel.innerHTML = `
         <h2 style="font-size:24px; font-weight:500;">GPU 0</h2>
         <p style="font-size:13px; opacity:0.8; margin-top:2px;">${gpuName}</p>
         <div style="font-size:12px; margin-top:15px; opacity:0.8;">3D</div>
         <div class="tm-graph-container" style="background:rgba(245, 158, 11, 0.1); border:1px solid #f59e0b;">
         </div>
         <div class="tm-info-grid" style="margin-top:20px;">
            <div class="tm-info-box"><span class="tm-info-label">Utilization</span><span class="tm-info-val">3%</span></div>
            <div class="tm-info-box"><span class="tm-info-label">Dedicated GPU memory</span><span class="tm-info-val">0.4/6.0 GB</span></div>
            <div class="tm-info-box"><span class="tm-info-label">Shared GPU memory</span><span class="tm-info-val">0.1/${Math.floor(hwMem / 2)}.0 GB</span></div>
            <div class="tm-info-box"><span class="tm-info-label">GPU Temperature</span><span class="tm-info-val">42°C</span></div>
            <div class="tm-info-box"><span class="tm-info-label">Driver version</span><span class="tm-info-val">536.23</span></div>
         </div>
      `;
      stopTaskManager();
    }
  }
});

function updateTaskbarState() {
  document.querySelectorAll('.taskbar-icon').forEach(icon => {
    const appId = icon.getAttribute('data-app');
    if (openWindows[appId]) {
      icon.classList.add('active');
      if (openWindows[appId].minimized) {
        icon.classList.add('minimized');
      } else {
        icon.classList.remove('minimized');
      }
    } else {
      icon.classList.remove('active', 'minimized');
    }
  });
}

// --- Window Management ---
function openApp(appId) {
  if (openWindows[appId]) {
    bringToFront(appId);
    if(openWindows[appId].minimized) {
        restoreWindow(appId);
    }
    return;
  }

  const appData = apps[appId];
  if (!appData) return;

  const win = document.createElement('div');
  win.className = 'app-window';
  win.id = `window-${appId}`;
  
  win.innerHTML = `
    <div class="window-header">
      <div class="window-title">
        <img src="${appData.icon}" alt="">
        <span>${appData.title}</span>
      </div>
      <div class="window-controls">
        <div class="win-control win-minimize"><i class="fa-solid fa-minus"></i></div>
        <div class="win-control win-maximize"><i class="fa-regular fa-square"></i></div>
        <div class="win-control win-close"><i class="fa-solid fa-xmark"></i></div>
      </div>
    </div>
    <div class="window-content">
      ${appData.render()}
    </div>
  `;

  windowsContainer.appendChild(win);
  openWindows[appId] = { el: win, minimized: false };
  
  if (appId === 'calculator') {
     win.style.width = '320px';
     win.style.height = '500px';
  } else if (appId === 'notepad') {
     win.style.width = '600px';
     win.style.height = '400px';
  } else if (appId === 'taskmanager') {
     win.style.width = '850px';
     win.style.height = '550px';
  }
  
  // Position slightly offset
  const offset = Object.keys(openWindows).length * 30;
  win.style.top = `${50 + offset}px`;
  win.style.left = `${100 + offset}px`;
  
  bringToFront(appId);
  updateTaskbarState();
  setTimeout(() => {
     win.classList.add('window-open');
     if (appId === 'taskmanager') startTaskManager();
  }, 10);
  setupWindowEvents(appId, win);
}

function bringToFront(appId) {
  const win = openWindows[appId].el;
  zIndexCounter++;
  win.style.zIndex = zIndexCounter;
}

function minimizeWindow(appId) {
    const win = openWindows[appId].el;
    const taskbarIcon = document.querySelector(`.taskbar-icon[data-app="${appId}"]`);
    if (taskbarIcon) {
        const rect = taskbarIcon.getBoundingClientRect();
        const winRect = win.getBoundingClientRect();
        const originX = rect.left + rect.width / 2 - winRect.left;
        const originY = rect.top + rect.height / 2 - winRect.top;
        win.style.transformOrigin = `${originX}px ${originY}px`;
    }
    win.classList.remove('window-open');
    win.classList.add('window-minimize');
    openWindows[appId].minimized = true;
    updateTaskbarState();
}

function restoreWindow(appId) {
    const win = openWindows[appId].el;
    win.style.transformOrigin = 'center center';
    win.classList.remove('window-minimize');
    win.classList.add('window-open');
    openWindows[appId].minimized = false;
    bringToFront(appId);
    updateTaskbarState();
}

function closeAppWindow(appId) {
    const win = openWindows[appId].el;
    win.style.transformOrigin = 'center center';
    win.classList.remove('window-open', 'window-minimize');
    win.classList.add('window-close');
    if (appId === 'taskmanager') stopTaskManager();
    setTimeout(() => {
      win.remove();
      delete openWindows[appId];
      updateTaskbarState();
    }, 250);
}

function setupWindowEvents(appId, win) {
  const header = win.querySelector('.window-header');
  const closeBtn = win.querySelector('.win-close');
  const maxBtn = win.querySelector('.win-maximize');
  const minBtn = win.querySelector('.win-minimize');

  win.addEventListener('mousedown', () => bringToFront(appId));

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAppWindow(appId);
  });

  maxBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    win.style.transition = 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)';
    win.classList.toggle('maximized');
    setTimeout(() => { win.style.transition = ''; }, 250);
    // If it's task manager, re-calc canvas size in a tick
    if (appId === 'taskmanager') {
      setTimeout(() => {
        const canvas = document.getElementById('tm-cpu-canvas');
        if(canvas) {
           canvas.width = canvas.parentElement.clientWidth;
           canvas.height = canvas.parentElement.clientHeight;
        }
      }, 300);
    }
  });

  minBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    minimizeWindow(appId);
  });

  // Dragging and Snapping Logic
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;
  let currentSnapZone = 'none';

  function getPreviewUI() {
    let preview = document.getElementById('snap-preview');
    if (!preview) {
      preview = document.createElement('div');
      preview.id = 'snap-preview';
      preview.style.position = 'absolute';
      preview.style.background = 'rgba(0, 120, 215, 0.2)';
      preview.style.border = '1px solid rgba(0, 120, 215, 0.4)';
      preview.style.backdropFilter = 'blur(12px)';
      preview.style.borderRadius = '12px';
      preview.style.pointerEvents = 'none';
      preview.style.zIndex = '999999';
      preview.style.transition = 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)';
      preview.style.opacity = '0';
      preview.style.transform = 'scale(0.98)';
      document.body.appendChild(preview);
    }
    return preview;
  }

  const onMouseMove = (e) => {
    if (!isDragging) return;
    
    let newTop = initialTop + e.clientY - startY;
    let newLeft = initialLeft + e.clientX - startX;
    
    if (newTop < 0) newTop = 0;
    
    win.style.transition = 'none';
    win.style.left = `${newLeft}px`;
    win.style.top = `${newTop}px`;

    const preview = getPreviewUI();
    const snapThreshold = 20;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    if (e.clientX <= snapThreshold && e.clientY <= snapThreshold) {
      currentSnapZone = 'top-left';
      preview.style.opacity = '1';
      preview.style.transform = 'scale(1)';
      preview.style.top = '0px';
      preview.style.left = '0px';
      preview.style.width = '50%';
      preview.style.height = '50%';
      preview.style.borderRadius = '0 12px 12px 0';
    } else if (e.clientX <= snapThreshold && e.clientY >= screenHeight - snapThreshold) {
      currentSnapZone = 'bottom-left';
      preview.style.opacity = '1';
      preview.style.transform = 'scale(1)';
      preview.style.top = '50%';
      preview.style.left = '0px';
      preview.style.width = '50%';
      preview.style.height = '50%';
      preview.style.borderRadius = '0 12px 0 0';
    } else if (e.clientX >= screenWidth - snapThreshold && e.clientY <= snapThreshold) {
      currentSnapZone = 'top-right';
      preview.style.opacity = '1';
      preview.style.transform = 'scale(1)';
      preview.style.top = '0px';
      preview.style.left = '50%';
      preview.style.width = '50%';
      preview.style.height = '50%';
      preview.style.borderRadius = '12px 0 0 12px';
    } else if (e.clientX >= screenWidth - snapThreshold && e.clientY >= screenHeight - snapThreshold) {
      currentSnapZone = 'bottom-right';
      preview.style.opacity = '1';
      preview.style.transform = 'scale(1)';
      preview.style.top = '50%';
      preview.style.left = '50%';
      preview.style.width = '50%';
      preview.style.height = '50%';
      preview.style.borderRadius = '12px 0 0 0';
    } else if (e.clientX <= snapThreshold) {
      currentSnapZone = 'left';
      preview.style.opacity = '1';
      preview.style.transform = 'scale(1)';
      preview.style.top = '0px';
      preview.style.left = '0px';
      preview.style.width = '50%';
      preview.style.height = '100%';
      preview.style.borderRadius = '0 12px 12px 0';
    } else if (e.clientX >= screenWidth - snapThreshold) {
      currentSnapZone = 'right';
      preview.style.opacity = '1';
      preview.style.transform = 'scale(1)';
      preview.style.top = '0px';
      preview.style.left = '50%';
      preview.style.width = '50%';
      preview.style.height = '100%';
      preview.style.borderRadius = '12px 0 0 12px';
    } else if (e.clientY <= snapThreshold) {
      currentSnapZone = 'top';
      preview.style.opacity = '1';
      preview.style.transform = 'scale(1)';
      preview.style.top = '0px';
      preview.style.left = '0px';
      preview.style.width = '100%';
      preview.style.height = '100%';
      preview.style.borderRadius = '0';
    } else {
      currentSnapZone = 'none';
      preview.style.opacity = '0';
      preview.style.transform = 'scale(0.98)';
    }
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    const preview = document.getElementById('snap-preview');
    if (preview) {
      preview.style.opacity = '0';
      preview.style.transform = 'scale(0.98)';
    }

    if (currentSnapZone !== 'none') {
      win.style.transition = 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
      win.classList.remove('maximized');
      win.style.borderRadius = '0';
      
      if (currentSnapZone === 'left') {
        win.style.top = '0px';
        win.style.left = '0px';
        win.style.width = '50%';
        win.style.height = '100%';
      } else if (currentSnapZone === 'right') {
        win.style.top = '0px';
        win.style.left = '50%';
        win.style.width = '50%';
        win.style.height = '100%';
      } else if (currentSnapZone === 'top-left') {
        win.style.top = '0px';
        win.style.left = '0px';
        win.style.width = '50%';
        win.style.height = '50%';
      } else if (currentSnapZone === 'bottom-left') {
        win.style.top = '50%';
        win.style.left = '0px';
        win.style.width = '50%';
        win.style.height = '50%';
      } else if (currentSnapZone === 'top-right') {
        win.style.top = '0px';
        win.style.left = '50%';
        win.style.width = '50%';
        win.style.height = '50%';
      } else if (currentSnapZone === 'bottom-right') {
        win.style.top = '50%';
        win.style.left = '50%';
        win.style.width = '50%';
        win.style.height = '50%';
      } else if (currentSnapZone === 'top') {
        win.classList.add('maximized');
      }
      
      setTimeout(() => {
        win.style.transition = '';
      }, 300);
      currentSnapZone = 'none';
    } else {
      win.style.transition = '';
    }
  };

  header.addEventListener('mousedown', (e) => {
    if (win.classList.contains('maximized')) {
      // If dragging a maximized window, restore it first.
      // But only if we are dragging from the header and not from window controls.
      if (e.target.closest('.window-controls')) return;
      win.classList.remove('maximized');
      // Set to a sensible default size if restoring
      win.style.width = '800px';
      win.style.height = '500px';
      win.style.left = `${e.clientX - 400}px`;
      win.style.top = `${e.clientY - 20}px`;
    }
    
    if (e.target.closest('.window-controls')) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    // Un-snap if dragging a snapped window (has inline width)
    if (win.style.width === '50%') {
       win.style.width = '800px';
       win.style.height = '500px';
       // Re-adjust start position to avoid jumping
       startX = e.clientX;
       startY = e.clientY;
       win.style.left = `${e.clientX - 400}px`;
       win.style.top = `${e.clientY - 20}px`;
    }

    initialLeft = parseInt(window.getComputedStyle(win).left, 10) || 0;
    initialTop = parseInt(window.getComputedStyle(win).top, 10) || 0;
    bringToFront(appId);

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}


// --- WebLLM Logic ---
let engine = null;
let enginePromise = null;
const selectedModel = "Phi-3-mini-4k-instruct-q4f16_1-MLC";
const chatHistory = [
  {
    role: "system",
    content: `You are J.A.R.V.I.S., the highly intelligent, formal, and loyal AI assistant from Iron Man. 
Address the user respectfully as "Sir" (or "Boss").
CRITICAL RULE: DO NOT output any JSON unless the user EXPLICITLY asks you to open an app or change system settings. For normal chat, reply formally with text in your persona.

ONLY if the user asks you to open an app, change background, or change theme, output a JSON block to trigger it.
Format exactly like this:
{"action": "open_app", "target": "appname"}
Supported apps: notepad, explorer, store, settings, calculator, taskmanager, photos.
For theme: {"action": "toggle_theme", "target": "dark"} or "light".
For background: {"action": "change_bg", "target": "next"}

DO NOT open notepad unless explicitly requested. Do not output JSON unless it is an explicit command. ALWAYS include a conversational text reply alongside the JSON (e.g., "Right away, Sir. I have opened the application.").`
  }
];

async function initializeWebLLM() {
   if (engine) return engine;
   if (enginePromise) {
       engine = await enginePromise;
       return engine;
   }
   
   enginePromise = (async () => {
       const webllm = await import("https://esm.run/@mlc-ai/web-llm");
       
       const initProgressCallback = (initProgress) => {
           const msgId = 'sys-loading';
           const container = document.getElementById('edge-chat-container');
           if (!container) return;
           let el = document.getElementById(msgId);
           if (!el) {
               const welcome = container.querySelector('div[style*="text-align:center"]');
               if (welcome) welcome.remove();

               container.innerHTML += `
             <div id="${msgId}" style="display:flex; gap:15px; margin-bottom:25px; max-width:800px; margin-left:auto; margin-right:auto; width:100%;">
                <div style="width:36px; height:36px; border-radius:4px; background:rgba(0,229,255,0.2); border:1px solid rgba(0,229,255,0.5); color:#00e5ff; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                   <i class="fa-solid fa-download"></i>
                </div>
                <div class="msg-content" style="flex:1; padding-top:8px; font-size:13px; opacity:0.8; font-family:'Courier New', monospace; color:#00e5ff;">
                   Initializing Protocol...
                </div>
             </div>
           `;
               el = document.getElementById(msgId);
           }
           if (el) el.querySelector('.msg-content').textContent = initProgress.text;
           if (container) container.scrollTop = container.scrollHeight;
       };

       try {
           const eng = await webllm.CreateMLCEngine(selectedModel, { initProgressCallback });
           const el = document.getElementById('sys-loading');
           if (el) el.remove();
           return eng;
       } catch (e) {
           console.error(e);
           const el = document.getElementById('sys-loading');
           if (el) el.querySelector('.msg-content').innerHTML = '<span style="color:#ff6b6b;">Failed to load WebLLM. Ensure you are using a Chromium browser with WebGPU enabled.</span>';
           throw e;
       }
   })();

   try {
      engine = await enginePromise;
   } catch(e) {
      enginePromise = null; // allow retry
   }
   return engine;
}

// Pre-load the engine when possible
setTimeout(initializeWebLLM, 2000);

async function sendOllamaMessage(prompt) {
   const container = document.getElementById('edge-chat-container');
   if (!container) return;

   const welcome = container.querySelector('div[style*="text-align:center"]');
   if (welcome) welcome.remove();

   container.innerHTML += `
      <div style="display:flex; gap:15px; margin-bottom:25px; max-width:800px; margin-left:auto; margin-right:auto; width:100%;">
         <div style="width:36px; height:36px; border-radius:4px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.3); color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            <i class="fa-solid fa-user"></i>
         </div>
         <div style="flex:1; padding-top:8px; font-weight:bold; word-break:break-word; font-family:'Courier New', monospace; color:#fff;">
            ${prompt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
         </div>
      </div>
   `;
   
   const msgId = 'msg-' + Date.now();
   container.innerHTML += `
      <div style="display:flex; gap:15px; margin-bottom:25px; max-width:800px; margin-left:auto; margin-right:auto; width:100%;">
         <div style="width:36px; height:36px; border-radius:4px; background:rgba(0,229,255,0.2); border:1px solid rgba(0,229,255,0.8); color:#00e5ff; display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 0 10px rgba(0,229,255,0.5);">
            <i class="fa-solid fa-microchip"></i>
         </div>
         <div id="${msgId}" style="flex:1; padding-top:8px; word-break:break-word; line-height:1.6; font-family:'Courier New', monospace; color:#00e5ff; text-shadow:0 0 5px rgba(0,229,255,0.3);">
            <i class="fa-solid fa-circle-notch fa-spin"></i> Processing...
         </div>
      </div>
   `;
   container.scrollTop = container.scrollHeight;

   chatHistory.push({ role: "user", content: prompt });

   if (!engine) await initializeWebLLM();

   try {
       const request = {
           messages: chatHistory,
           temperature: 0.7,
           stream: true
       };
       
       const asyncChunkGenerator = await engine.chat.completions.create(request);
       const el = document.getElementById(msgId);
       el.innerHTML = ''; 
       let fullMessage = "";
       
       for await (const chunk of asyncChunkGenerator) {
           const text = chunk.choices[0]?.delta?.content || "";
           fullMessage += text;
           // Hide JSON and markdown blocks while streaming
           let displayMessage = fullMessage.replace(/```(?:json)?\s*\{"action"[\s\S]*?(?:\}\s*```|\}|$)/gi, '')
                                           .replace(/\{"action"[\s\S]*?(?:\}|$)/gi, '')
                                           .trim();
           el.innerHTML = displayMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
           container.scrollTop = container.scrollHeight;
       }
       chatHistory.push({ role: "assistant", content: fullMessage });

       // JS Router: Parse JSON commands from the final output
       const commandRegex = /\{"action"\s*:\s*"([^"]+)",\s*"target"\s*:\s*"([^"]+)"\}/g;
       const matches = [...fullMessage.matchAll(commandRegex)];
       
       for (const match of matches) {
           const action = match[1];
           const target = match[2];
           
           if (action === "open_app" && apps[target]) {
               if (!openWindows[target]) {
                   openApp(target);
               } else {
                   restoreWindow(target);
               }
           } else if (action === "change_bg") {
               const wallpapers = [
                   'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564',
                   'https://images.unsplash.com/photo-1506744626753-1fa44df14d28?q=80&w=2564',
                   'https://images.unsplash.com/photo-1511300636408-a63a89df3482?q=80&w=2564',
                   'https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?q=80&w=2564',
                   'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2564'
               ];
               currentWallpaper = wallpapers[Math.floor(Math.random() * wallpapers.length)];
               const desktop = document.querySelector('.desktop');
               if (desktop) desktop.style.backgroundImage = `url('${currentWallpaper}')`;
           } else if (action === "toggle_theme") {
               const toggle = document.getElementById('theme-toggle');
               if (target === 'light' && currentTheme === 'dark') {
                  currentTheme = 'light';
                  document.body.classList.add('light-mode');
                  if (toggle) toggle.classList.remove('on');
               } else if (target === 'dark' && currentTheme === 'light') {
                  currentTheme = 'dark';
                  document.body.classList.remove('light-mode');
                  if (toggle) toggle.classList.add('on');
               }
           }
       }

       // Hide the JSON string from the user UI
       let cleanMessage = fullMessage.replace(/```(?:json)?\s*\{"action"[\s\S]*?(?:\}\s*```|\}|$)/gi, '')
                                     .replace(/\{"action"[\s\S]*?(?:\}|$)/gi, '')
                                     .trim();
       
       if (cleanMessage === "" && matches.length > 0) {
           cleanMessage = "I have executed your command successfully.";
       }
       
       el.innerHTML = cleanMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
   } catch (err) {
       console.error(err);
       document.getElementById(msgId).innerHTML = '<span style="color:#ff6b6b;"><i class="fa-solid fa-circle-exclamation"></i> Error running WebLLM. Ensure WebGPU is enabled.</span>';
   }
}

document.addEventListener('click', (e) => {
   if (e.target.closest('#edge-send-btn')) {
      const input = document.getElementById('edge-prompt-input');
      if (input && input.value.trim()) {
         const val = input.value.trim();
         input.value = '';
         sendOllamaMessage(val);
      }
   }
});

document.addEventListener('keydown', (e) => {
   if (e.key === 'Enter' && e.target.id === 'edge-prompt-input') {
      const input = e.target;
      if (input.value.trim()) {
         const val = input.value.trim();
         input.value = '';
         sendOllamaMessage(val);
      }
   }
});

// --- System Tray & Task Manager Logic Additions ---

// 1. Battery Percentage Logic
if ('getBattery' in navigator) {
  navigator.getBattery().then(function(battery) {
    const updateBattery = () => {
      const level = Math.round(battery.level * 100);
      const textEl = document.getElementById('battery-text');
      const iconEl = document.getElementById('battery-icon');
      if(textEl) textEl.innerText = level + '%';
      if(iconEl) {
         if (battery.charging) {
            iconEl.className = 'fa-solid fa-plug-circle-bolt';
            iconEl.style.color = '#107c10';
         } else {
            if(level > 75) iconEl.className = 'fa-solid fa-battery-full';
            else if(level > 50) iconEl.className = 'fa-solid fa-battery-three-quarters';
            else if(level > 25) iconEl.className = 'fa-solid fa-battery-half';
            else iconEl.className = 'fa-solid fa-battery-quarter';
            iconEl.style.color = level <= 20 ? '#e81123' : '';
         }
      }
    };
    updateBattery();
    battery.addEventListener('levelchange', updateBattery);
    battery.addEventListener('chargingchange', updateBattery);
  });
}

// 2. System Tray Flyouts
const trayArrow = document.getElementById('tray-arrow');
const openAppsFlyout = document.getElementById('open-apps-flyout');
const openAppsList = document.getElementById('open-apps-list');
const trayAudio = document.getElementById('tray-audio');
const quickSettingsFlyout = document.getElementById('quick-settings-flyout');

if (trayArrow) {
   trayArrow.addEventListener('click', (e) => {
      e.stopPropagation();
      quickSettingsFlyout.classList.add('hidden');
      const wifiFlyout = document.getElementById('wifi-flyout');
      if(wifiFlyout) wifiFlyout.classList.add('hidden');
      
      openAppsFlyout.classList.toggle('hidden');
      trayArrow.style.transform = openAppsFlyout.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
      
      if (!openAppsFlyout.classList.contains('hidden')) {
         openAppsList.innerHTML = '';
         Object.keys(openWindows).forEach(appId => {
            const app = apps[appId];
            openAppsList.innerHTML += `
               <div class="open-app-item">
                  <img src="${app.icon}">
                  <span style="flex:1;">${app.title}</span>
                  <button class="pin-btn" data-appid="${appId}" style="background:var(--theme-hover); color:var(--theme-text); border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">
                     ${app.pinned ? 'Unpin' : 'Pin'}
                  </button>
               </div>
            `;
         });
      }
   });
}
if (trayAudio) {
   trayAudio.addEventListener('click', (e) => {
      e.stopPropagation();
      openAppsFlyout.classList.add('hidden');
      if (trayArrow) trayArrow.style.transform = 'rotate(0deg)';
      const wifiFlyout = document.getElementById('wifi-flyout');
      if(wifiFlyout) wifiFlyout.classList.add('hidden');
      quickSettingsFlyout.classList.toggle('hidden');
   });
}

const trayWifi = document.getElementById('tray-wifi');
if (trayWifi) {
   trayWifi.addEventListener('click', (e) => {
      e.stopPropagation();
      openAppsFlyout.classList.add('hidden');
      if (trayArrow) trayArrow.style.transform = 'rotate(0deg)';
      quickSettingsFlyout.classList.add('hidden');
      const wifiFlyout = document.getElementById('wifi-flyout');
      if(wifiFlyout) wifiFlyout.classList.toggle('hidden');
   });
}

document.addEventListener('click', (e) => {
   if (openAppsFlyout && !e.target.closest('#open-apps-flyout') && !e.target.closest('#tray-arrow')) {
      openAppsFlyout.classList.add('hidden');
      if (trayArrow) trayArrow.style.transform = 'rotate(0deg)';
   }
   if (quickSettingsFlyout && !e.target.closest('#quick-settings-flyout') && !e.target.closest('#tray-audio')) {
      quickSettingsFlyout.classList.add('hidden');
   }
   const wifiFlyout = document.getElementById('wifi-flyout');
   if (wifiFlyout && !e.target.closest('#wifi-flyout') && !e.target.closest('#tray-wifi')) {
      wifiFlyout.classList.add('hidden');
   }
   
   // Handle Pin/Unpin from flyouts or task manager
   if (e.target.closest('.pin-btn')) {
      const btn = e.target.closest('.pin-btn');
      const appId = btn.dataset.appid;
      if (apps[appId]) {
         apps[appId].pinned = !apps[appId].pinned;
         renderTaskbar();
         renderStartMenu();
         btn.innerText = apps[appId].pinned ? 'Unpin' : 'Pin';
      }
   }
   
   // Microsoft Store Navigation
   if (e.target.closest('.store-nav-item')) {
      const navItem = e.target.closest('.store-nav-item');
      const targetId = navItem.dataset.target;
      if (targetId) {
         const storeSidebar = navItem.closest('.store-sidebar');
         if (storeSidebar) {
             storeSidebar.querySelectorAll('.store-nav-item').forEach(el => el.classList.remove('active'));
             navItem.classList.add('active');
         }
         const storeContent = navItem.closest('.store-app').querySelector('.store-content');
         if (storeContent) {
             storeContent.querySelectorAll('.store-page').forEach(page => page.style.display = 'none');
             const targetPage = storeContent.querySelector('#' + targetId);
             if (targetPage) targetPage.style.display = 'block';
         }
      }
   }
   
   // Task Manager Processes Tab
   if (e.target.closest('.tm-sidebar-icon[title="Processes"]')) {
      document.querySelectorAll('.tm-sidebar-icon').forEach(el => el.classList.remove('active'));
      e.target.closest('.tm-sidebar-icon').classList.add('active');
      const tmContent = document.getElementById('tm-perf-view');
      if (tmContent) {
         let html = '<div style="padding:20px; width:100%;"><h2 style="font-size:24px; font-weight:500; margin-bottom:20px;">Running Processes</h2><div style="display:flex; flex-direction:column; gap:10px;">';
         Object.keys(apps).forEach(appId => {
            const app = apps[appId];
            html += `
               <div style="display:flex; align-items:center; justify-content:space-between; padding:10px; background:var(--theme-hover); border-radius:8px;">
                  <div style="display:flex; align-items:center; gap:12px;">
                     <img src="${app.icon}" style="width:24px;">
                     <span style="font-weight:500;">${app.title}</span>
                  </div>
                  <div>
                     <span style="font-size:12px; opacity:0.7; margin-right:15px;">${openWindows[appId] ? 'Running' : 'Stopped'}</span>
                     <button class="pin-btn" data-appid="${appId}" style="background:var(--accent); color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">
                        ${app.pinned ? 'Unpin from Taskbar' : 'Pin to Taskbar'}
                     </button>
                  </div>
               </div>
            `;
         });
         html += '</div></div>';
         tmContent.innerHTML = html;
         tmContent.style.flexDirection = 'column';
      }
   }
   
   // Restore Performance Tab
   if (e.target.closest('.tm-sidebar-icon[title="Performance"]')) {
      // Restore perfectly without re-rendering by triggering a re-render of taskmanager window
      const win = document.getElementById('window-taskmanager');
      if (win) {
         closeApp('taskmanager');
         setTimeout(() => openApp('taskmanager'), 250);
      }
   }
});

const volSlider = document.getElementById('volume-slider');
const volVal = document.getElementById('volume-val');
if(volSlider) {
   volSlider.addEventListener('input', (e) => {
      volVal.innerText = e.target.value;
   });
}

const brightSlider = document.getElementById('brightness-slider');
const brightVal = document.getElementById('brightness-val');
if(brightSlider) {
   brightSlider.addEventListener('input', (e) => {
      brightVal.innerText = e.target.value;
      const overlay = document.getElementById('brightness-overlay') || (() => {
         const div = document.createElement('div');
         div.id = 'brightness-overlay';
         div.style.position = 'fixed';
         div.style.top = '0'; div.style.left = '0'; div.style.width = '100vw'; div.style.height = '100vh';
         div.style.pointerEvents = 'none'; div.style.zIndex = '999999';
         document.body.appendChild(div);
         return div;
      })();
      const opacity = 1 - (e.target.value / 100);
      overlay.style.backgroundColor = `rgba(0,0,0,${opacity * 0.35})`;
   });
}
