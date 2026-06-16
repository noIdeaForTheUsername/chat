export interface BaseFileInfo {
  uuid: string;
  messageId: number;
  uploadedAt: Date;
  originalName: string;
  type: FileType;
  sizeInBytes: number;
}

export interface FileInfo extends BaseFileInfo {
  url: string;
}

export type FileType = "image" | "video" | "downloadable";