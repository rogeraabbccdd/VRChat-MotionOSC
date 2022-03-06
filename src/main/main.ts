const {app, BrowserWindow, ipcMain} = require('electron')
const Path = require('path')
const osc = require("osc")

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: Path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  if (process.env.NODE_ENV === 'development') {
    const rendererPort = process.argv[2];
    mainWindow.loadURL(`http://localhost:${rendererPort}`);
  }
  else {
    mainWindow.loadFile(Path.join(app.getAppPath(), 'renderer', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
});

const vrchatOSC = new osc.UDPPort({
  remoteAddress: "localhost",
  remotePort: 9000,
  metadata: true
})
vrchatOSC.open()

ipcMain.on('setFace', (event, { parameter, value }) => {
  vrchatOSC.send({
    address: `/avatar/parameters/${parameter}`,
    args: {
      type: 'f',
      value: parseInt(value)
    }
  })
})

// https://docs.vrchat.com/docs/osc-as-input-controller
ipcMain.on('jump', () => {
  // Jump
  vrchatOSC.send({
    address: '/input/Jump',
    args: {
      type: 'i',
      value: 1
    }
  })
  // Reset jump button
  setTimeout(() => {
    vrchatOSC.send({
      address: '/input/Jump',
      args: {
        type: 'i',
        value: 0
      }
    })
  }, 10)
})

// Item Grab
ipcMain.on('GrabAxisRight', () => {
  vrchatOSC.send({
    address: '/input/GrabAxisRight',
    args: {
      type: 'f',
      value: 1
    }
  })
})

// Item Release
ipcMain.on('DropAxisRight', () => {
  vrchatOSC.send({
    address: '/input/GrabAxisRight',
    args: {
      type: 'f',
      value: 0
    }
  })
  vrchatOSC.send({
    address: '/input/SpinHoldLR',
    args: {
      type: 'f',
      value: 0
    }
  })
  vrchatOSC.send({
    address: '/input/MoveHoldFB',
    args: {
      type: 'f',
      value: 0
    }
  })
  vrchatOSC.send({
    address: '/input/SpinHoldUD',
    args: {
      type: 'f',
      value: 0
    }
  })
})

// Item move / spin
ipcMain.on('SpinHoldLR', (event, value) => {
  vrchatOSC.send({
    address: '/input/SpinHoldLR',
    args: {
      type: 'f',
      value
    }
  })
})

ipcMain.on('MoveHoldFB', (event, value) => {
  vrchatOSC.send({
    address: '/input/MoveHoldFB',
    args: {
      type: 'f',
      value
    }
  })
})

ipcMain.on('SpinHoldUD', (event, value) => {
  vrchatOSC.send({
    address: '/input/SpinHoldUD',
    args: {
      type: 'f',
      value
    }
  })
})

// Turn
ipcMain.on('LookHorizontal', (event, value) => {
  vrchatOSC.send({
    address: '/input/LookHorizontal',
    args: {
      type: 'f',
      value
    }
  })
})

// Move
ipcMain.on('MoveRight', (event, value) => {
  vrchatOSC.send({
    address: '/input/MoveRight',
    args: {
      type: 'i',
      value
    }
  })
})
ipcMain.on('MoveLeft', (event, value) => {
  vrchatOSC.send({
    address: '/input/MoveLeft',
    args: {
      type: 'i',
      value
    }
  })
})
ipcMain.on('MoveForward', (event, value) => {
  vrchatOSC.send({
    address: '/input/MoveForward',
    args: {
      type: 'i',
      value
    }
  })
})
ipcMain.on('MoveBackward', (event, value) => {
  vrchatOSC.send({
    address: '/input/MoveBackward',
    args: {
      type: 'i',
      value
    }
  })
})
ipcMain.on('Run', (event, value) => {
  vrchatOSC.send({
    address: '/input/Run',
    args: {
      type: 'i',
      value
    }
  })
})
