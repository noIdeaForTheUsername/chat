

export interface FileInfoResponse {
  uuid: string;
  messageId: number;
  uploadedAt: Date;
  originalName: string;
  type: FileTypeResponse;
  sizeInBytes: number;
}

export type FileTypeResponse = "image" | "video" | "downloadable";