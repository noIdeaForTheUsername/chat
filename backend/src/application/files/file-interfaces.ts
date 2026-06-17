

export interface FileInfoResponse {
  uuid: string;
  messageId: number;
  uploadedAt: Date;
  originalName: string;
  type: AppFileType;
  sizeInBytes: number;
  mediaWidth: number | null;
  mediaHeight: number | null;
}

export type AppFileType = "image" | "video" | "downloadable";

export interface FileTypeInfo {
  mimeType: string;
  mimeTypeTrusted: boolean;
  mediaWidth: number | null;
  mediaHeight: number | null;
}