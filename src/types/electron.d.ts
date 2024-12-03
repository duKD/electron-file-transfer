interface IElectronAPI {
  setReceiveDir(newDir: string): Promise<void>;
  getDefaultPath(): Promise<string>;
  selectFolder(): Promise<{ canceled: boolean; filePaths: string[] }>;
  selectFile(): Promise<{ canceled: boolean; filePaths: string[] }>;
  startServer(): Promise<{ code: string }>;
  startTransfer(folderPath: string): Promise<{ code: string }>;
  getServerInfo(): Promise<{
    isRunning: boolean;
    code: string;
    hasClient: boolean;
  }>;
  startClient(code: string): Promise<string>;
  copyText(text: string): Promise<void>;
  onTransferClientProgress(
    callback: (data: {
      progress: number;
      transferred: number;
      total: number;
      speed: number;
      msg: string;
    }) => void
  ): void;
  onTransferServerProgress(
    callback: (data: {
      progress: number;
      transferred: number;
      total: number;
      speed: number;
      msg: string;
    }) => void
  ): void;
  stopServer(): Promise<void>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}

export {};
