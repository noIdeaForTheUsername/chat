import { Injectable, StreamableFile } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import multer from 'multer';
import fs, { createReadStream } from 'fs';
import path from "path";

@Injectable()
export class FilesStorageService {

  public readonly uploadsDirectory: string;

  constructor(
    private readonly configService: ConfigService
  ) {
    this.uploadsDirectory = this.configService.getOrThrow("files.uploadsDirectory");
  }

  getMulterFileDiskStorage() {
    return multer.diskStorage({
      destination: this.uploadsDirectory,
      filename: (req, file, cb) => {
        cb(null, randomUUID() + ".blob");
      }
    });
  }

  async getFileResponseStream(fileUuid: string) {
    const pathName = await this.getValidFilePathOrThrow(fileUuid);
    const file = createReadStream(pathName);
    return new StreamableFile(file);
  }

  private async getValidFilePathOrThrow(uuid: string) {
    const filename = path.basename(uuid) + ".blob";
    const pathName = path.join(this.uploadsDirectory, filename);
    console.log(`Checking file path: ${pathName}`);
    await new Promise((resolve, reject) => {
      fs.access(pathName, (err) => {
        if (err)
          reject(new Error("File not found"));
        else
          resolve(pathName);
      });
    });
    return pathName;
  }
}