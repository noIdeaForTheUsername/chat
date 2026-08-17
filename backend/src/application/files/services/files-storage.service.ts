import { Injectable, InternalServerErrorException, NotFoundException, StreamableFile } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import multer from 'multer';
import fs, { createReadStream } from 'fs';
import path, { basename } from "path";
import { LoggingService } from "src/shared/logging/app-logger";
import { isUUID } from "class-validator";


@Injectable()
export class FilesStorageService {

  public readonly uploadsDirectory: string;
  public static readonly fileSizeLimitBytes = 1024 ** 3; // 1 GB
  public static readonly filesPerMessageLimit = 30;
  public readonly unuploadedFilePrefix = 'unuploaded-';

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggingService
  ) {
    this.uploadsDirectory = this.configService.getOrThrow("files.uploadsDirectory");
  }

  // files are created in the filesystem automatically by multer

  getMulterFileDiskStorage() {
    return multer.diskStorage({
      destination: this.uploadsDirectory,
      filename: (req, file, cb) => {
        cb(null, this.unuploadedFilePrefix + this.uuidToFileName(randomUUID()));
      }
    });
  }

  async renameUploadedFile(file: Express.Multer.File) {
    const newName = file.filename.replace(this.unuploadedFilePrefix, "");
    const newPath = file.path.replace(file.filename, newName);
    await fs.promises.rename(file.path, newPath);
    file.filename = newName;
    file.path = newPath;
  }

  async getFileResponseStream(fileUuid: string) {
    let pathName;
    try {
      pathName = await this.getExistingFilePath(fileUuid);
    }
    catch (err) {
      if (err.code === 'ENOENT')
        throw new NotFoundException();
      else
        throw new InternalServerErrorException();
    }
    const file = createReadStream(pathName);
    return new StreamableFile(file);
  }

  public async deleteFileFromDiskByUuid(fileUuid: string) {
    let pathName = await this.getExistingFilePath(fileUuid);
    await this.deleteFileFromDiskByPath(pathName);
  }

  public async deleteFileFromDiskByPath(path: string) {
    try {
      await fs.promises.unlink(path);
    }
    catch (err) {
      if (err.code === 'ENOENT')
        return;  // ignore, file already gone
      else
        throw err;
    }
  }

  private async getExistingFilePath(uuid: string): Promise<string> {
    const filename = this.uuidToFileName(uuid);
    const pathName = path.join(this.uploadsDirectory, filename);
    await fs.promises.access(pathName);
    return pathName;
  }

  private uuidToFileName(uuid: string): string {
    if (!isUUID(uuid))
      throw new Error("invalid-uuid: " + uuid);
    return uuid + ".blob";
  }

  fileNameToUuid(fileName: string): string {
    fileName = basename(fileName);
    fileName = fileName.replace(this.unuploadedFilePrefix, "");
    const dotIndex = fileName.lastIndexOf('.');
    if (dotIndex !== -1)
      fileName = fileName.substring(0, dotIndex);
    if (!isUUID(fileName))
      throw new Error("invalid filename, is not a UUID: " + fileName);
    return fileName;
  }
}