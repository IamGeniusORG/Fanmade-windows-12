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
const ICON_EXPLORER = 'https://img.icons8.com/color/48/mac-folder.png';
const ICON_EDGE = 'https://ollama.com/public/icon-64x64.png';
const ICON_STORE = 'https://img.icons8.com/color/48/windows-store.png';
const ICON_NOTEPAD = 'https://img.icons8.com/color/48/notepad.png';
const ICON_PHOTOS = 'https://img.icons8.com/color/48/gallery.png';
const ICON_SETTINGS = 'https://img.icons8.com/color/48/settings--v1.png';
const ICON_TERMINAL = 'https://img.icons8.com/color/48/console.png';
const ICON_CALCULATOR = 'https://img.icons8.com/color/48/calculator--v1.png';
const ICON_TASKMANAGER = 'https://img.icons8.com/color/48/task-manager.png';


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
              <div class="folder-item"><img src="${ICON_EXPLORER}"><span>Projects</span></div>
              <div class="folder-item"><img src="${ICON_EXPLORER}"><span>Work</span></div>
              <div class="folder-item"><img src="${ICON_EXPLORER}"><span>Personal</span></div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  browser: {
    title: 'Ollama Assistant',
    icon: ICON_EDGE,
    pinned: true, taskbar: true, desktop: true,
    render: () => `
      <div style="display:flex; flex-direction:column; height:100%; background:var(--theme-bg); font-family: 'Inter', sans-serif;">
         <div style="padding:20px; display:flex; align-items:center; gap:15px; border-bottom:1px solid var(--theme-border); background:var(--theme-bg-hover);">
            <img src="${ICON_EDGE}" style="width:32px; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.2));">
            <div>
               <h2 style="font-size:18px; margin:0; font-weight:600;">Ollama Assistant</h2>
               <p style="margin:0; font-size:12px; opacity:0.6;">Running locally on your hardware</p>
            </div>
         </div>
         <div id="edge-chat-container" style="flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:20px;">
            <div style="text-align:center; margin-top:10vh; opacity:0.8;">
               <img src="${ICON_EDGE}" style="width:80px; margin-bottom:15px; opacity:0.9;">
               <h1 style="font-size:24px; font-weight:500; margin-bottom:10px;">How can I help you today?</h1>
               <p style="font-size:14px;">I'm your personal AI, powered entirely by your local Ollama instance.</p>
            </div>
         </div>
         <div style="padding:15px 20px; background:var(--theme-bg); border-top:1px solid var(--theme-border);">
            <div style="display:flex; gap:10px; background:var(--theme-bg-hover); padding:5px 5px 5px 15px; border-radius:24px; border:1px solid var(--theme-border); align-items:center;">
               <input type="text" id="edge-prompt-input" placeholder="Message Ollama..." style="flex:1; background:transparent; border:none; color:var(--theme-text); outline:none; font-size:14px;">
               <button id="edge-send-btn" style="background:var(--accent); color:#fff; border:none; width:36px; height:36px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:0.2s;"><i class="fa-solid fa-arrow-up"></i></button>
            </div>
            <div style="text-align:center; font-size:11px; opacity:0.5; margin-top:8px;">AI generated content may be inaccurate</div>
         </div>
      </div>
    `
  },
  store: {
    title: 'Microsoft Store',
    icon: ICON_STORE,
    pinned: true, taskbar: true, desktop: true,
    render: () => `
      <div style="padding: 40px; text-align: center; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--theme-bg);">
        <img src="${ICON_STORE}" style="width: 80px; margin-bottom: 20px;">
        <h2>Microsoft Store</h2>
        <p style="opacity: 0.7; margin-top: 10px;">Discover the best apps, games, and entertainment.</p>
      </div>
    `
  },
  notepad: {
    title: 'Notepad',
    icon: ICON_NOTEPAD,
    pinned: true, taskbar: false, desktop: true,
    render: () => `
      <div style="height: 100%; display: flex; flex-direction: column; background: var(--theme-bg);">
        <div style="padding: 5px 10px; border-bottom: 1px solid var(--theme-border); font-size: 13px; display:flex; gap: 15px;">
           <span style="cursor:pointer;">File</span>
           <span style="cursor:pointer;">Edit</span>
           <span style="cursor:pointer;">View</span>
        </div>
        <textarea style="flex:1; width:100%; border:none; resize:none; outline:none; padding:10px; background:transparent; color:var(--theme-text); font-family:Consolas, monospace; font-size:14px;" placeholder="Start typing here..."></textarea>
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
     let lastVal = cpuData[cpuData.length - 1];
     let nextVal = lastVal + (Math.random() * 20 - 10);
     if(nextVal < 2) nextVal = 2 + Math.random() * 5;
     if(nextVal > 100) nextVal = 95;
     cpuData.shift();
     cpuData.push(nextVal);

     const utilEl = document.getElementById('tm-cpu-util');
     const subEl = document.getElementById('tm-cpu-sub');
     const speedEl = document.getElementById('tm-cpu-speed');
     if(utilEl) utilEl.textContent = Math.round(nextVal) + '%';
     if(subEl) subEl.textContent = Math.round(nextVal) + '% ' + (cpuName.length > 15 ? cpuName.substring(0,15) + '...' : cpuName);
     if(speedEl) speedEl.textContent = (2.5 + (nextVal/100)*2).toFixed(2) + ' GHz';

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
              openWindows[appId].el.classList.remove('open');
              openWindows[appId].minimized = true;
              updateTaskbarState();
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
     win.classList.add('open');
     if (appId === 'taskmanager') startTaskManager();
  }, 10);
  setupWindowEvents(appId, win);
}

function bringToFront(appId) {
  const win = openWindows[appId].el;
  zIndexCounter++;
  win.style.zIndex = zIndexCounter;
}

function setupWindowEvents(appId, win) {
  const header = win.querySelector('.window-header');
  const closeBtn = win.querySelector('.win-close');
  const maxBtn = win.querySelector('.win-maximize');
  const minBtn = win.querySelector('.win-minimize');

  win.addEventListener('mousedown', () => bringToFront(appId));

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    win.classList.remove('open');
    if (appId === 'taskmanager') stopTaskManager();
    setTimeout(() => {
      win.remove();
      delete openWindows[appId];
      updateTaskbarState();
    }, 200);
  });

  maxBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    win.classList.toggle('maximized');
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
    win.classList.remove('open');
    openWindows[appId].minimized = true;
    updateTaskbarState();
  });

  // Dragging with Bounds checking
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  header.addEventListener('mousedown', (e) => {
    if (win.classList.contains('maximized')) return;
    if (e.target.closest('.window-controls')) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialLeft = parseInt(window.getComputedStyle(win).left, 10);
    initialTop = parseInt(window.getComputedStyle(win).top, 10);
    bringToFront(appId);
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    let newTop = initialTop + e.clientY - startY;
    let newLeft = initialLeft + e.clientX - startX;
    
    // Bounds checking
    if (newTop < 0) newTop = 0;
    
    win.style.left = `${newLeft}px`;
    win.style.top = `${newTop}px`;
  });

  document.addEventListener('mouseup', () => { isDragging = false; });
}

function restoreWindow(appId) {
    const win = openWindows[appId].el;
    win.classList.add('open');
    openWindows[appId].minimized = false;
    bringToFront(appId);
    updateTaskbarState();
}

// --- Edge Browser / Ollama Logic ---
let ollamaModel = null;
async function fetchOllamaModel() {
   try {
      const res = await fetch('http://localhost:11434/api/tags');
      const data = await res.json();
      if (data.models && data.models.length > 0) {
         ollamaModel = data.models[0].name;
      }
   } catch (e) {
      console.warn('Ollama not running or models not found');
   }
}
fetchOllamaModel();

async function sendOllamaMessage(prompt) {
   const container = document.getElementById('edge-chat-container');
   if (!container) return;

   const welcome = container.querySelector('div[style*="text-align:center"]');
   if (welcome) welcome.remove();

   container.innerHTML += `
      <div style="display:flex; gap:15px; margin-bottom:25px; max-width:800px; margin-left:auto; margin-right:auto; width:100%;">
         <div style="width:36px; height:36px; border-radius:50%; background:var(--theme-bg-hover); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            <i class="fa-solid fa-user"></i>
         </div>
         <div style="flex:1; padding-top:8px; font-weight:500; word-break:break-word;">
            ${prompt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
         </div>
      </div>
   `;
   
   const msgId = 'msg-' + Date.now();
   container.innerHTML += `
      <div style="display:flex; gap:15px; margin-bottom:25px; max-width:800px; margin-left:auto; margin-right:auto; width:100%;">
         <div style="width:36px; height:36px; border-radius:50%; background:var(--accent); color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            <i class="fa-solid fa-sparkles"></i>
         </div>
         <div id="${msgId}" style="flex:1; padding-top:8px; word-break:break-word; line-height:1.6;">
            <i class="fa-solid fa-circle-notch fa-spin"></i> Generating answers for you...
         </div>
      </div>
   `;
   container.scrollTop = container.scrollHeight;

   if (!ollamaModel) await fetchOllamaModel();

   try {
      const response = await fetch('http://localhost:11434/api/generate', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            model: ollamaModel || 'llama3',
            prompt: prompt,
            stream: false
         })
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      document.getElementById(msgId).innerHTML = data.response.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
   } catch (err) {
      document.getElementById(msgId).innerHTML = '<span style="color:#ff6b6b;"><i class="fa-solid fa-circle-exclamation"></i> Error connecting to local Ollama. Ensure it is running on port 11434 and CORS is allowed. Try running: <code>set OLLAMA_ORIGINS="*"</code> and restarting Ollama.</span>';
   }
   container.scrollTop = container.scrollHeight;
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
