export interface BaseFileInfo {
  uuid: string;
  messageId: number;
  uploadedAt: Date;
  originalName: string;
  type: FileType;
  sizeInBytes: number;
  mediaWidth: number | null;
  mediaHeight: number | null;
}

export interface FileInfo extends BaseFileInfo {
  url: string;
}

export type FileType = "image" | "video" | "downloadable";