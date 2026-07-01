import { Injectable, InternalServerErrorException, NotFoundException, StreamableFile } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import multer from 'multer';
import fs, { createReadStream } from 'fs';
import path, { basename } from "path";
import { Cron, CronExpression } from "@nestjs/schedule";
import { FilesDomainService } from "src/domain/files/files.service";
import { LoggingService } from "src/shared/logging/app-logger";
import { isUUID } from "class-validator";


@Injectable()
export class FilesStorageService {

  public readonly uploadsDirectory: string;
  private readonly filesMaxUploadTimeMs = 1000 * 3600 * 24;
  private readonly unuploadedFilePrefix = 'unuploaded-';

  constructor(
    private readonly configService: ConfigService,
    private readonly filesDomainService: FilesDomainService,
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

  async deleteFileFromDisk(fileUuid: string) {
    try {
      let pathName = await this.getExistingFilePath(fileUuid);
      await fs.promises.unlink(pathName);
    }
    catch (err) {
      if (err.code === 'ENOENT')
        return;  // ignore, file already gone
      else
        this.logger.error(`Failed to delete file with UUID ${fileUuid} from disk. Error: ${err}`, "FilesStorageService");
    }
  }

  @Cron(CronExpression.EVERY_8_HOURS)
  private async deleteFilesWithoutDatabaseInfo() {
    this.logger.log("Starting uploads cleanup job. Files in the uploads directory that"
      + " don't have database info will be deleted.", "FilesStorageService");

    const allDatabaseFilesUuids = new Set<string>((
      await this.filesDomainService.getAllFilesUuids()).map((entity) => entity.uuid
    ));
    const fileNames = await fs.promises.readdir(this.uploadsDirectory);

    let deletions: Promise<any>[] = [];
    for (const fileName of fileNames) {

      if (await this.getFileBeingUploaded(fileName))
        continue;

      const fileSystemUuid = this.fileNameToUuid(fileName);
      if (allDatabaseFilesUuids.has(fileSystemUuid))
        continue;

      deletions.push(this.deleteFileFromDisk(fileSystemUuid));
      if (deletions.length >= 100) {
        await Promise.allSettled(deletions);
        deletions = [];
      }
    }
    if (deletions.length > 0)
      await Promise.allSettled(deletions);

    this.logger.log("Uploads cleanup job completed.", "FilesStorageService");
  }

  private async getFileBeingUploaded(fileName: string): Promise<boolean> {
    if (fileName.startsWith(this.unuploadedFilePrefix)) {
      const fileCreatedAt = (await fs.promises.stat(path.join(this.uploadsDirectory, fileName))).mtimeMs;
      const fileAge = Date.now() - fileCreatedAt;
      if (fileAge < this.filesMaxUploadTimeMs) {
        return true;
      }
    }
    return false;
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