import { Injectable } from "@nestjs/common";
import { AppFileType, FileInfoResponse, FileTypeInfo } from "../file-interfaces";
import { imageSizeFromFile } from "image-size/fromFile";
import { fileTypeFromFile } from "file-type";
import ffprobe from "ffprobe";
import ffprobeStatic from "ffprobe-static";
import { FileInfo } from "src/domain/files/entities/file-info.entity";
import { ViewedFileInfo } from "src/domain/files/entities/viewed-file-info";
import { ConfigService } from "@nestjs/config";

type Dimensions = { width: number | null, height: number | null };

@Injectable()
export class FileTypesService {

  private readonly maxDisplayableImageSize = 15 * 1024 * 1024; // 15 MB
  private readonly maxDisplayableVideoSize = 30 * 1024 * 1024; // 30 MB
  
  private ffprobePath: string;
  constructor(
    private config: ConfigService
  ) {
    this.ffprobePath = this.config.get<string>("files.ffprobePath") ?? ffprobeStatic.path;
  }

  async getFileInfo(file: Express.Multer.File): Promise<FileTypeInfo> {
    const { mimeType, mimeTypeTrusted } = await this.getMimeTypeInfo(file);
    
    let dimensions: Dimensions = { width: null, height: null };
    if (mimeTypeTrusted) {
      dimensions = await this.getMediaFileDimensions(file.path, mimeType);
    }

    let returnObject = {
      mimeType,
      mimeTypeTrusted,
      mediaWidth: dimensions.width,
      mediaHeight: dimensions.height
    }

    return returnObject;
  }

  getAppFileType(fileInfo: FileInfo | ViewedFileInfo): AppFileType {
    let fileType: AppFileType = "downloadable";

    // renderable media must be trusted and have detected dimensions. They also have size limits
    if (fileInfo.mimeTypeTrusted && fileInfo.mediaWidth && fileInfo.mediaHeight) {
      if (fileInfo.mimeType.includes("image") && fileInfo.sizeInBytes < this.maxDisplayableImageSize)
        fileType = "image";
      else if (fileInfo.mimeType.includes("video") && fileInfo.sizeInBytes < this.maxDisplayableVideoSize)
        fileType = "video";
    }
    return fileType;
  }

  convertFileInfoToResponse(fileInfo: FileInfo): FileInfoResponse {
    let appFileType = this.getAppFileType(fileInfo);
    
    return {
      uuid: fileInfo.uuid,
      messageId: fileInfo.messageId,
      uploadedAt: fileInfo.uploadedAt,
      originalName: fileInfo.originalName,
      type: appFileType,
      sizeInBytes: fileInfo.sizeInBytes,
      mediaWidth: fileInfo.mediaWidth,
      mediaHeight: fileInfo.mediaHeight
    };
  }

  private async getMimeTypeInfo(file: Express.Multer.File):
    Promise<{mimeType: string, mimeTypeTrusted: boolean}>
  {
    const mimeTypeDetectionResult = await this.detectMimetype(file.path);
    const mimeTypeTrusted = mimeTypeDetectionResult != undefined;
    const mimeType = mimeTypeDetectionResult ? mimeTypeDetectionResult.mime : file.mimetype;
    return { mimeType, mimeTypeTrusted };
  }

  private async detectMimetype(filePath: string)  {
    return await fileTypeFromFile(filePath);
  }

  private async getMediaFileDimensions(filePath: string, mimeType: string): Promise<Dimensions> {
    try {
      if (mimeType?.includes("image")) {
        return await this.getImageDimensions(filePath);
      }
      else if (mimeType?.includes("video")) {
        return await this.getVideoDimensions(filePath);
      }
    }
    catch (error) {}  // On error return null dimensions
    return { width: null, height: null };
  }

  private async getImageDimensions(filePath: string): Promise<Dimensions> {
    const dims = await imageSizeFromFile(filePath);
    if ([5, 6, 7, 8].includes(dims.orientation ?? 1))
      return { width: dims.height, height: dims.width };
    else
      return { width: dims.width, height: dims.height };
  }
  
  private async getVideoDimensions(filePath: string): Promise<Dimensions> {
    const info = await ffprobe(filePath, { path: this.ffprobePath });
    for (const stream of info.streams) {
      if (stream.codec_type == "video" && stream.width && stream.height) {
        return { width: stream.width, height: stream.height };
      }
    }
    throw new Error("no-video-stream");
  }
}