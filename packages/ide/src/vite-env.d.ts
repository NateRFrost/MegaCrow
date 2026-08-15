/// <reference types="vite/client" />

interface FileSystemHandle {
  readonly kind: "file" | "directory";
  readonly name: string;
}

interface FileSystemFileHandle extends FileSystemHandle {
  createWritable(): Promise<FileSystemWritableFileStream>;
  getFile(): Promise<File>;
  readonly kind: "file";
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  getDirectoryHandle(
    name: string,
    options?: { create?: boolean }
  ): Promise<FileSystemDirectoryHandle>;
  getFileHandle(
    name: string,
    options?: { create?: boolean }
  ): Promise<FileSystemFileHandle>;
  readonly kind: "directory";
  values(): AsyncIterableIterator<FileSystemHandle>;
}

interface FileSystemWritableFileStream extends WritableStream {
  close(): Promise<void>;
  write(data: BufferSource | Blob | string): Promise<void>;
}

interface StorageManager {
  getDirectory(): Promise<FileSystemDirectoryHandle>;
}

interface Navigator {
  storage: StorageManager;
}

interface Window {
  showDirectoryPicker(options?: {
    mode?: "read" | "readwrite";
  }): Promise<FileSystemDirectoryHandle>;
}
