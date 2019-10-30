const electron = require('electron');
const path = require('path');
const shell = require('electron').shell;
const app = electron.app;
const Menu = electron.Menu;
const BrowserWindow = electron.BrowserWindow;
const fs = require('fs');
const contextMenu = require('electron-context-menu');
const getTemplate = require('./menu');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'Overleaf Desktop',
    width: 800,
    height: 600,
    frame: process.platform != "darwin",
    titleBarStyle: process.platform == "darwin" ? 'hidden' : 'default',
    icon: path.join(__dirname, 'assets', 'icons', 'png', 'overleaf.png'),
    show: process.platform != "darwin",
    webPreferences: {
      nodeIntegration: false,
      nativeWindowOpen: true,
      preload: path.join(__dirname, 'preload')
    },
    transparent: process.platform == "darwin"
  });

  mainWindow.loadURL("https://v2.overleaf.com/");

  mainWindow.webContents.on('dom-ready', () => {
    addCustomCSS(mainWindow);
  });

  app.on('window-all-closed', () => {
    mainWindow.webContents.session.flushStorageData();
    mainWindow = null;
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on('before-quit', (event) => {
    mainWindow.webContents.session.flushStorageData();
  });

  mainWindow.on('closed', (event) => {
    mainWindow.webContents.session.flushStorageData();
  });

  mainWindow.webContents.on('new-window', function (e, url) {
    e.preventDefault();
    if (url.indexOf("v2.overleaf.com") != -1) {
      mainWindow.loadURL(url);
      addCustomCSS(mainWindow);
      mainWindow.webContents.session.flushStorageData();
    } else {
      shell.openExternal(url);
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

function addCustomCSS(windowElement) {
  platform = process.platform == "darwin" ? "macos" : "";
  windowElement.webContents.insertCSS(
    fs.readFileSync(path.join(__dirname, 'assets', 'css', 'style.css'), 'utf8')
  );

  const platformCSSFile = path.join(
    __dirname,
    'assets',
    'css',
    `style.${platform}.css`
  );
  if (fs.existsSync(platformCSSFile)) {
    windowElement.webContents.insertCSS(
      fs.readFileSync(platformCSSFile, 'utf8')
    );
  }
}

function init() {
  app.setName("Overleaf Desktop");

  app.on('window-all-closed', function () {
    mainWindow.webContents.session.flushStorageData();
    mainWindow = null;
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on('activate', function () {
    if (mainWindow === null) {
      createWindow();
      // Dynamically pick a menu-type
      let template = getTemplate(process.platform);
      let menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);
    }
  });

  app.on('ready', function () {
    if (app.isPackaged) {
      contextMenu({
        shouldShowMenu: true
      });
    } else {
      contextMenu({
        shouldShowMenu: true,
        showInspectElement: true
      });
    }

    if (process.platform == "darwin") {
      app.dock.bounce("critical");
    }
    createWindow();

    // Dynamically pick a menu-type
    let template = getTemplate(process.platform);
    let menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  });
}

init();