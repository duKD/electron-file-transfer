import { Server, Socket } from "net";
import { BrowserWindow } from "electron";
import { generateCode } from "./utils";
import * as fs from "fs";
import * as path from "path";

export class FileTransferServer {
  private server: Server | null = null;
  private code: string = "";
  private readonly DELIMITER = "\n@@@@\n";
  private currentSocket: Socket | null = null;
  private totalSize: number = 0;
  private transferredSize: number = 0;
  private lastUpdateTime: number = Date.now();
  private bytesInLastSecond: number = 0;
  private currentSpeed: number = 0;

  constructor(private window: BrowserWindow) {}

  /**
   * 启动服务器
   */
  async start(): Promise<{ code: string }> {
    return new Promise((resolve) => {
      this.server = new Server(async (socket) => {
        console.log("客户端已连接");
        console.log("客户端地址:", socket.remoteAddress, socket.remotePort);
        this.currentSocket = socket;

        socket.on("error", (err) => {
          console.error("Socket error:", err);
          this.currentSocket = null;
        });

        socket.on("close", () => {
          console.log("客户端断开连接");
          this.currentSocket = null;
        });
      });

      this.server.listen(0, "0.0.0.0", () => {
        const address = this.server!.address();
        if (address && typeof address !== "string") {
          console.log(`服务器运行在 ${address.address}:${address.port}`);
          const networkInterfaces = require("os").networkInterfaces();
          Object.values(networkInterfaces).forEach((interfaces: any) => {
            interfaces.forEach((item: any) => {
              if (item.family === "IPv4" && !item.internal) {
                console.log(`${item.address}:${address.port}`);
                this.code = generateCode(item.address, address.port);
              }
            });
          });
          resolve({ code: this.code });
        }
      });
    });
  }

  /**
   * 开始传输文件
   */
  async startTransfer(filePath: string) {
    if (!this.currentSocket) {
      throw new Error("没有客户端连接");
    }

    try {
      const stat = fs.statSync(filePath);
      this.totalSize = stat.size;
      this.transferredSize = 0;

      // 发送文件信息
      await this.sendMessage({
        type: "fileInfo",
        name: path.basename(filePath),
        size: this.totalSize,
      });

      // 发送文件内容
      await this.sendFileContent(filePath);

      // 发送完成消息
      await this.sendMessage({ type: "complete" });
    } catch (error) {
      console.error("传输错误:", error);
      throw error;
    }
  }

  /**
   * 发送文件内容
   */
  private async sendFileContent(filePath: string): Promise<void> {
    console.log(`开始发送文件内容: ${filePath}`);

    return new Promise((resolve, reject) => {
      try {
        const fileStream = fs.createReadStream(filePath);

        fileStream.on("data", (chunk) => {
          const canContinue = this.currentSocket!.write(chunk);
          this.transferredSize += chunk.length;

          // 发送传输进度
          this.window.webContents.send("transferServer:progress", {
            progress: Math.floor((this.transferredSize / this.totalSize) * 100),
            transferred: this.transferredSize,
            total: this.totalSize,
            speed: this.calculateSpeed(chunk.length),
            msg: `正在传输: ${path.basename(filePath)}`,
          });

          if (!canContinue) {
            fileStream.pause();
            this.currentSocket!.once("drain", () => {
              fileStream.resume();
            });
          }
        });

        fileStream.on("end", () => {
          console.log("文件流读取完成");
          this.window.webContents.send("transferServer:progress", {
            progress: 100,
            transferred: this.totalSize,
            total: this.totalSize,
            speed: 0,
            msg: "传输完成",
          });
          resolve();
        });

        fileStream.on("error", (err) => {
          console.error("文件流错误:", err);
          reject(err);
        });
      } catch (err) {
        console.error("读取文件错误:", err);
        reject(err);
      }
    });
  }

  /**
   * 计算传输速度
   */
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

  /**
   * 发送控制消息
   */
  private async sendMessage(message: any): Promise<void> {
    console.log("sendMessage----", message);
    return new Promise((resolve, reject) => {
      const messageStr = JSON.stringify(message) + this.DELIMITER;
      this.currentSocket!.write(messageStr, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  /**
   * 停止服务器
   */
  async stop() {
    if (this.currentSocket) {
      this.currentSocket.destroy();
      this.currentSocket = null;
    }

    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => resolve());
      });
      this.server = null;
    }
  }

  /**
   * 获取服务器状态
   */
  getInfo() {
    return {
      isRunning: !!this.server,
      code: this.code,
      hasClient: !!this.currentSocket,
    };
  }
}
