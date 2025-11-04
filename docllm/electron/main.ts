import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { promises as fs } from 'fs';
import path, { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Fix for ES modules in Electron
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL;

function createWindow() {
    // Use __dirname directly (available in CommonJS after compilation)
    const preloadPath = path.join(__dirname, 'preload.js');

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        show: false,
        icon: path.join(__dirname, '../assets/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            preload: preloadPath,
        },
        titleBarStyle: 'default',
        autoHideMenuBar: !isDev,
    });

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.center();
        }
    });

    // Fallback to show window
    setTimeout(() => {
        if (mainWindow && !mainWindow.isVisible()) {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.center();
        }
    }, 3000);

    // Load the app
    if (isDev && process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);

        mainWindow.webContents.once('dom-ready', () => {
            if (mainWindow) {
                mainWindow.webContents.openDevTools();
            }
        });
    } else {
        // Production: load the built HTML file
        const htmlPath = path.join(__dirname, 'index.html');
        mainWindow.loadFile(htmlPath).catch(err => {
        });
    }

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Handle external links securely
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        return { action: 'deny' };
    });
}

// App event handlers
app.whenReady().then(() => {
    createWindow();

    // macOS: Re-create window when dock icon is clicked
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

// Add IPC handlers for file operations
ipcMain.handle('load-documents', async () => {
    try {
        const userDataPath = app.getPath('userData');
        const documentsPath = path.join(userDataPath, 'documents');
        const indexPath = path.join(documentsPath, 'index.json');

        const data = await fs.readFile(indexPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading documents:', error);
        return { documents: [], lastUpdated: new Date() };
    }
});

ipcMain.handle('save-documents', async (_, documents) => {
    try {
        const userDataPath = app.getPath('userData');
        const documentsPath = path.join(userDataPath, 'documents');
        const indexPath = path.join(documentsPath, 'index.json');

        await fs.mkdir(documentsPath, { recursive: true });

        const data = {
            documents,
            lastUpdated: new Date()
        };

        await fs.writeFile(indexPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving documents:', error);
        return false;
    }
});

ipcMain.handle('import-text-file', async () => {
    try {
        const result = await dialog.showOpenDialog(mainWindow!, {
            properties: ['openFile'],
            filters: [
                { name: 'Text Files', extensions: ['txt', 'md', 'json', 'csv'] },
                { name: 'Markdown Files', extensions: ['md', 'markdown'] },
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (!result.canceled && result.filePaths.length > 0) {
            const content = await fs.readFile(result.filePaths[0], 'utf-8');
            const fileName = path.basename(result.filePaths[0]);
            return { content, fileName };
        }
        return null;
    } catch (error) {
        console.error('Error importing file:', error);
        throw error;
    }
});