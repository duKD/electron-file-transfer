import * as os from "os";
import { BrowserWindow } from "electron";
import { parseCode } from "./utils";
const net = require("net");
const fs = require("fs");
const path = require("path");

const DELIMITER = "\n@@@@\n";

export class FileTransferClient {
  private receiveDir: string = path.join(os.homedir(), "Documents");
  private client: any = null;
  private cur_win: BrowserWindow | null = null;
  private buffer: Buffer = Buffer.alloc(0);
  private currentFile: any = null;
  private fileWriter: any = null;
  private isReceivingFile: boolean = false;
  private currentFileSize: number = 0;
  private receivedSize: number = 0;
  private lastUpdateTime: number = Date.now();
  private bytesInLastSecond: number = 0;
  private currentSpeed: number = 0;

  constructor(win: BrowserWindow) {
    this.cur_win = win;
  }

  public connect(code: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const connectionInfo = parseCode(code);
      if (!connectionInfo) {
        reject(new Error("无效的连接口令"));
        return;
      }

      const { ip: HOST, port: PORT } = connectionInfo;
      this.client = new net.Socket();

      this.setupEventListeners();

      this.client.connect(PORT, HOST, () => {
        console.log("已连接到服务器");
        resolve(this.receiveDir);
      });
    });
  }

  public disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client.destroy();
      this.client = null;
      console.log("已断开连接");
    }
  }

  public setReceiveDir(newDir: string): void {
    console.log("setReceiveDir", newDir);
    this.receiveDir = newDir;
    this.ensureReceiveDir();
  }

  private ensureReceiveDir(): void {
    if (!fs.existsSync(this.receiveDir)) {
      fs.mkdirSync(this.receiveDir, { recursive: true });
    }
  }

  private setupEventListeners() {
    this.client.on("data", (data: Buffer) => {
      this.buffer = Buffer.concat([this.buffer, data]);

      if (this.isReceivingFile) {
        const remainingFileSize = this.currentFileSize - this.receivedSize;
        const chunk = this.buffer.subarray(
          0,
          Math.min(this.buffer.length, remainingFileSize)
        );

        if (chunk.length > 0) {
          this.fileWriter.write(chunk);
          this.receivedSize += chunk.length;
          this.buffer = this.buffer.subarray(chunk.length);

          // 发送进度更新
          this.cur_win?.webContents.send("transferClient:progress", {
            progress: Math.floor(
              (this.receivedSize / this.currentFileSize) * 100
            ),
            transferred: this.receivedSize,
            total: this.currentFileSize,
            speed: this.calculateSpeed(chunk.length),
            msg: `正在接收: ${this.currentFile.name}`,
          });
        }

        if (this.receivedSize >= this.currentFileSize) {
          this.isReceivingFile = false;
          this.fileWriter.end();
          this.fileWriter = null;

          // 发送完成进度
          this.cur_win?.webContents.send("transferClient:progress", {
            progress: 100,
            transferred: this.currentFileSize,
            total: this.currentFileSize,
            speed: 0,
            msg: "传输完成",
          });
        }
      }

      this.processBuffer();
    });

    this.client.on("close", () => {
      console.log("连接已关闭");
    });

    this.client.on("error", (err: Error) => {
      console.error("连接错误:", err);
    });
  }

  private processBuffer() {
    while (true) {
      if (this.isReceivingFile) return;

      const delimiterIndex = this.buffer.indexOf(DELIMITER);
      if (delimiterIndex === -1) break;

      const messageStr = this.buffer.subarray(0, delimiterIndex).toString();
      this.buffer = this.buffer.subarray(delimiterIndex + DELIMITER.length);

      try {
        const message = JSON.parse(messageStr);
        this.handleMessage(message);
      } catch (e) {
        console.error("解析消息失败:", messageStr);
        console.error(e);
      }
    }
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case "fileInfo":
        this.currentFile = message;
        this.currentFileSize = message.size;
        this.receivedSize = 0;
        console.log(
          `开始接收文件: ${this.currentFile.name} (大小: ${this.currentFileSize} 字节)`
        );

        const filePath = path.join(
          this.receiveDir,
          path.basename(this.currentFile.name)
        );
        this.ensureReceiveDir();
        this.fileWriter = fs.createWriteStream(filePath);
        this.isReceivingFile = true;
        break;

      case "complete":
        console.log("文件传输完成");
        this.disconnect();
        break;
    }
  }

  private calculateSpeed(chunkSize: number): number {
    const now = Date.now();
    const timeDiff = now - this.lastUpdateTime;

    if (timeDiff >= 1000) {
      this.currentSpeed = Math.floor(
        (this.bytesInLastSecond * 1000) / timeDiff
      );
      this.bytesInLastSecond = chunkSize;
      this.lastUpdateTime = now;
    } else {
      this.bytesInLastSecond += chunkSize;
    }

    return this.currentSpeed;
  }
}
