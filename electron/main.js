const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
let backendProcess = null;

// 啟動後端服務
function startBackend() {
  // 判斷開發或生產環境
  const isDev = !!process.env.ELECTRON_START_URL;
  let backendPath;
  
  if (isDev) {
    // 開發環境：使用 Python 直接啟動 Flask 應用
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    backendProcess = spawn(pythonCommand, [path.join(__dirname, '../backend/app.py')]);
  } else {
    // 生產環境：使用打包好的執行檔
    const executableExtension = process.platform === 'win32' ? '.exe' : '';
    backendPath = path.join(__dirname, '../build/backend/image_splitter_backend' + executableExtension);
    backendProcess = spawn(backendPath);
  }
  
  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend stdout: ${data}`);
  });
  
  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend stderr: ${data}`);
  });
  
  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Image Splitter',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // 開啟開發者工具（在生產環境可以移除）
  if (process.env.ELECTRON_START_URL) {
    win.webContents.openDevTools();
  }

  // 判斷開發或生產環境
  const startUrl = process.env.ELECTRON_START_URL ||
    `file://${path.join(__dirname, '../frontend/dist/index.html')}`;
  
  console.log('Loading URL:', startUrl);
  
  win.loadURL(startUrl);
  
  // 監聽載入失敗
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load URL:', errorDescription);
    
    // 嘗試載入一個簡單的 HTML
    win.loadURL(`data:text/html,
      <html>
        <body>
          <h1>Image Splitter</h1>
          <p>Vue 開發伺服器無法連接。請確保 Vue 伺服器已啟動 (npm run serve)。</p>
          <p>錯誤: ${errorDescription}</p>
        </body>
      </html>
    `);
  });
}

app.whenReady().then(() => {
  startBackend();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // 關閉後端進程
  if (backendProcess) {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', backendProcess.pid, '/f', '/t']);
    } else {
      backendProcess.kill();
    }
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 