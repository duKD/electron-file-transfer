export interface FileInfo {
  path: string;          // 文件相对路径
  size: number;          // 文件大小
  isDirectory: boolean;  // 是否是文件夹
  chunks: number;        // 分片数量
}

export interface TransferProgress {
  path: string;          // 文件路径
  progress: number;      // 传输进度 (0-100)
  status: 'pending' | 'transferring' | 'completed' | 'error';
  error?: string;
}

export interface TransferMessage {
  type: 'start' | 'data' | 'end' | 'error';
  fileInfo?: FileInfo;
  chunkIndex?: number;
  data?: Buffer;
  error?: string;
} 