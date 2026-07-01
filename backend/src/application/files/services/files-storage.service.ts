import { Injectable, InternalServerErrorException, NotFoundException, StreamableFile } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import multer from 'multer';
import fs, { createReadStream } from 'fs';
import path, { resolve } from "path";

@Injectable()
export class FilesStorageService {

  public readonly uploadsDirectory: string;

  constructor(
    private readonly configService: ConfigService
  ) {
    this.uploadsDirectory = this.configService.getOrThrow("files.uploadsDirectory");
  }

  // files are created in the filesystem automatically by multer

  getMulterFileDiskStorage() {
    return multer.diskStorage({
      destination: this.uploadsDirectory,
      filename: (req, file, cb) => {
        cb(null, randomUUID() + ".blob");
      }
    });
  }

  async getFileResponseStream(fileUuid: string) {
    let pathName = await this.getValidFilePathOrThrow(fileUuid);
    const file = createReadStream(pathName);
    return new StreamableFile(file);
  }

  async deleteFileFromDisk(fileUuid: string) {
    let pathName = await this.getValidFilePathOrThrow(fileUuid);
    await new Promise((resolve, reject) => {
      fs.rm(pathName, (err) => {
        if (err)
          reject(new InternalServerErrorException());
        else
          resolve(null);
      });
    });
  }

  private async getValidFilePathOrThrow(uuid: string): Promise<string> {
    const filename = path.basename(uuid) + ".blob";
    const pathName = path.join(this.uploadsDirectory, filename);
    await new Promise((resolve, reject) => {
      fs.access(pathName, (err) => {
        if (err)
          reject(new NotFoundException());
        else
          resolve(pathName);
      });
    });
    return pathName;
  }
}