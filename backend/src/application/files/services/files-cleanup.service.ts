import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { FilesStorageService } from "./files-storage.service";
import { LoggingService } from "src/shared/logging/app-logger";
import fs from "fs";
import { FilesDomainService } from "src/domain/files/files.service";
import path from "path/win32";

@Injectable()
export class FilesCleanupService {


  constructor(
    private readonly storage: FilesStorageService,
    private readonly logger: LoggingService,
    private readonly filesDomainService: FilesDomainService
  ) { }

  @Cron(CronExpression.EVERY_8_HOURS)
  private async tryDeleteFilesWithoutDatabaseInfo() {
    this.logger.log("Starting uploads cleanup job. Files in the uploads directory that"
      + " don't have database info will be deleted.", "FilesCleanupService");

    try {
      await this.deleteFilesWithoutDatabaseInfo();
    }
    catch (err) {
      this.logger.error(`Failed to delete files without database info: ${err.message ?? 'unknown error'}`,
        "FilesCleanupService");
        return;
    }
    this.logger.log("Uploads cleanup job completed.", "FilesCleanupService");
  }

  private async deleteFilesWithoutDatabaseInfo() {
    const allDatabaseFilesUuids = await this.getDatabaseFilesUuids();
    const fileNames = await this.getFileSystemNames();

    let pathsToDelete: string[] = [];
    for (const fileName of fileNames) {

      if (await this.isFileBeingUploaded(fileName))
        continue;

      try {
        const fileSystemUuid = this.storage.fileNameToUuid(fileName);
        if (allDatabaseFilesUuids.has(fileSystemUuid))
          continue;
      }
      catch (err) {
        // ignore file name not being a valid UUID, it should be deleted anyways
      }
      
      pathsToDelete.push(path.join(this.storage.uploadsDirectory, fileName));
    }
    this.deleteFiles(pathsToDelete);
  }

  private async getDatabaseFilesUuids(): Promise<Set<string>> {
    return new Set<string>(
      (await this.filesDomainService.getAllFilesUuids())
      .map((entity) => entity.uuid)
    );
  }

  private async getFileSystemNames() {
    try {
      return await fs.promises.readdir(this.storage.uploadsDirectory);
    }
    catch (err) {
      throw new Error(`Failed to read uploads directory: ${err.message ?? 'unknown error'}`);
    }
  }

  private async deleteFiles(pathsToDelete: string[]) {
    let results = await Promise.allSettled(pathsToDelete.map(
      path => this.storage.deleteFileFromDiskByPath(path)
    ));
    let firstErrorReason: string | null = null;
    let failures = 0;
    for (let result of results) {
      if (result.status == "rejected") {
        failures++;
        if (firstErrorReason == null)
          firstErrorReason = result.reason;
      }
    }
    if (failures > 0) {
      throw new Error(`${failures} file deletions out of ${results.length} failed. First error reason: ${firstErrorReason}`);
    }
  }

  private async isFileBeingUploaded(fileName: string): Promise<boolean> {
    return fileName.startsWith(this.storage.unuploadedFilePrefix);
  }
}