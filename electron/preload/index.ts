import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  setReceiveDir: (newDir: string) =>
    ipcRenderer.invoke("client:setReceiveDir", newDir),
  getDefaultPath: () => ipcRenderer.invoke("client:getDefaultPath"),
  selectFolder: () => ipcRenderer.invoke("dialog:openFolder"),
  selectFile: () => ipcRenderer.invoke("dialog:openFile"),
  startServer: () => ipcRenderer.invoke("server:start"),
  stopServer: () => ipcRenderer.invoke("server:stop"),
  startTransfer: (folderPath: string) =>
    ipcRenderer.invoke("server:startTransfer", folderPath),
  getServerInfo: () => ipcRenderer.invoke("server:getInfo"),
  startClient: (code: string) => ipcRenderer.invoke("server:startClient", code),
  copyText: (text: string) => ipcRenderer.invoke("server:copyText", text),
  onTransferClientProgress: (
    callback: (data: {
      progress: number;
      transferred: number;
      total: number;
      speed: number;
      msg: string;
    }) => void
  ) => ipcRenderer.on("transferClient:progress", (_, data) => callback(data)),
  onTransferServerProgress: (
    callback: (data: {
      progress: number;
      transferred: number;
      total: number;
      speed: number;
      msg: string;
    }) => void
  ) => ipcRenderer.on("transferServer:progress", (_, data) => callback(data)),
});
