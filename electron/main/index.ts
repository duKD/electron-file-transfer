import { app, BrowserWindow, ipcMain, dialog, clipboard } from "electron";
import { join } from "path";
import os from "os";
import { FileTransferServer } from "./tcpServer";
import { FileTransferClient } from "./tcpClient";

// 统一管理实例
interface AppInstances {
  mainWindow: BrowserWindow | null;
  fileServer: FileTransferServer | null;
  fileClient: FileTransferClient | null;
}

const instances: AppInstances = {
  mainWindow: null,
  fileServer: null,
  fileClient: null,
};
// 清理已存在的处理程序
const handlers = [
  "server:start",
  "server:startTransfer",
  "server:getInfo",
  "dialog:openFolder",
  "dialog:openFile",
  "server:startClient",
  "server:copyText",
  "server:stopServer",
  "client:getDefaultPath",
  "client:setReceiveDir",
  "server:stop",
];
// 统一管理 IPC 处理程序
function setupIpcHandlers(win: BrowserWindow) {
  handlers.forEach((handler) => {
    if (ipcMain.listenerCount(handler) > 0) {
      ipcMain.removeHandler(handler);
    }
  });

  ipcMain.handle("client:getDefaultPath", async () => {
    return join(os.homedir(), "Documents");
  });

  ipcMain.handle("client:setReceiveDir", async (_, newDir: string) => {
    if (!instances.fileClient) {
      instances.fileClient = new FileTransferClient(win);
    }
    instances.fileClient.setReceiveDir(newDir);
  });

  // 注册新的处理程序
  ipcMain.handle("server:start", async () => {
    if (!instances.fileServer) {
      instances.fileServer = new FileTransferServer(win);
    }
    return instances.fileServer.start();
  });

  ipcMain.handle("server:stop", async () => {
    instances.fileServer?.stop();
  });

  ipcMain.handle("server:startTransfer", async (_, folderPath: string) => {
    if (!instances.fileServer) {
      instances.fileServer = new FileTransferServer(win);
    }
    return instances.fileServer.startTransfer(folderPath);
  });

  ipcMain.handle("server:getInfo", async () => {
    if (!instances.fileServer) {
      instances.fileServer = new FileTransferServer(win);
    }
    return instances.fileServer.getInfo();
  });

  ipcMain.handle("dialog:openFolder", async () => {
    try {
      return await dialog.showOpenDialog({
        properties: ["openDirectory", "createDirectory"],
        title: "选择要传输的文件夹",
      });
    } catch (error) {
      console.error("打开文件夹对话框失败:", error);
      throw error;
    }
  });

  //选择单个文件
  ipcMain.handle("dialog:openFile", async () => {
    return await dialog.showOpenDialog({
      properties: ["openFile"],
      title: "选择要传输的文件",
    });
  });

  ipcMain.handle("server:startClient", async (_, code: string) => {
    if (!instances.fileClient) {
      instances.fileClient = new FileTransferClient(win);
    }
    return instances.fileClient.connect(code);
  });

  ipcMain.handle("server:copyText", async (_, text: string) => {
    try {
      clipboard.writeText(text);
    } catch (error) {
      console.error("复制文本失败:", error);
      throw error;
    }
  });
}

function createWindow() {
  instances.mainWindow = new BrowserWindow({
    width: 960,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: join(__dirname, "../preload/index.js"),
    },
  });

  setupIpcHandlers(instances.mainWindow);

  if (process.env.VITE_DEV_SERVER_URL) {
    instances.mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    instances.mainWindow.webContents.openDevTools();
  } else {
    instances.mainWindow.loadFile(join(__dirname, "../../dist/index.html"));
  }
}

// 资源清理
function cleanup() {
  handlers.forEach((handler) => {
    ipcMain.removeHandler(handler);
  });

  instances.fileServer?.stop();
  instances.fileClient?.disconnect();
  instances.mainWindow = null;
  instances.fileServer = null;
  instances.fileClient = null;
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  cleanup();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 应用退出前的清理
app.on("before-quit", cleanup);

// 添加错误处理
process.on("uncaughtException", (error) => {
  console.error("未捕获的异常:", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("未处理的 Promise 拒绝:", reason);
});
