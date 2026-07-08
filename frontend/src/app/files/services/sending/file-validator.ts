import { inject, Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { AlertService } from "@src/app/alerts/alert-service/alert.service";
import { AlertType } from "@src/app/alerts/alert-type.enum";
import { environment as env } from "@src/environments/environment";
import { FileCompressorService } from "./file-compressor";

@Injectable({
  providedIn: 'root',
})
export class FilesValidatorService {

  private readonly FILE_MAX_SIZE_MB = env.maxFileSizeMB;
  private readonly ALL_FILES_MAX_SIZE_MB = env.maxTotalFilesSizeMB;
  public static readonly MAX_FILES_PER_MESSAGE = env.maxFilesPerMessage;

  private readonly FILE_MAX_SIZE_BYTES = this.FILE_MAX_SIZE_MB * 1024 * 1024;
  private readonly ALL_FILES_MAX_SIZE_BYTES = this.ALL_FILES_MAX_SIZE_MB * 1024 * 1024;

  private alertService = inject(AlertService);
  private translate = inject(TranslateService);
  private compressor = inject(FileCompressorService);

  // returns valid files only; displays alerts about what went wrong with invalid files
  // supposed to be called when adding files to the message
  public validateSelectedMessageFiles(files: File[]): File[] {
    if (!this.validateAmount(files))
      return [];
    let validFiles = this.filterIncompressibleOversizedFiles(files);
    return validFiles;
  }

  // supposed to be called just before sending fully processed, compressed files
  public validateSentMessageFiles(files: File[]): File[] | false {
    let validFiles = this.filterAllOversizedFiles(files);
    if (validFiles.length === 0)
      return false;
    
    let limitedFiles = this.limitTotalFileSize(validFiles);
    if (limitedFiles.length == 0)
      return false;

    return limitedFiles;
  }

  private validateAmount(files: File[]): boolean {
    if (files.length > FilesValidatorService.MAX_FILES_PER_MESSAGE) {
      this.alertService.displayMessageAlert(
        AlertType.ERROR,
        this.translate.instant('page.chat.max-files-exceeded', { max: FilesValidatorService.MAX_FILES_PER_MESSAGE }),
      );
      return false;
    }
    return true;
  }

  private filterIncompressibleOversizedFiles(files: File[]): File[] {
    return this.filterFiles(files,
      file => file.size <= this.FILE_MAX_SIZE_BYTES
        || this.compressor.getFileTypeEligibleForCompression(file),
      (invalidFiles) => this.displayOversizedFilesAlert(invalidFiles));
  }

  private filterAllOversizedFiles(files: File[]): File[] {
    return this.filterFiles(files, file => file.size <= this.FILE_MAX_SIZE_BYTES, 
      (invalidFiles) => this.displayOversizedFilesAlert(invalidFiles));
  }

  private filterFiles(files: File[], filterFn: (file: File) => boolean, invalidFilesFn?: (files: File[]) => any): File[] {
    let valid: File[] = [];
    let invalid: File[] = [];
    for (const file of files) {
      if (filterFn(file))
        valid.push(file);
      else
        invalid.push(file);
    }
    if (invalid.length > 0 && invalidFilesFn !== undefined) {
      invalidFilesFn(invalid);
    }
    return valid;
  }

  private limitTotalFileSize(files: File[]): File[] {
    let limitedFiles = [...files];
    while (this.getFilesSizeBytes(limitedFiles) > this.ALL_FILES_MAX_SIZE_BYTES) {
      limitedFiles = this.removeLargestFile(limitedFiles);
    }
    if (limitedFiles.length < files.length) {
      this.alertService.displayMessageAlert(
        AlertType.ERROR,
        this.translate.instant('page.chat.max-total-size-exceeded', { max: this.ALL_FILES_MAX_SIZE_MB })
      )
    }
    return limitedFiles;
  }

  private getFilesSizeBytes(files: File[]): number {
    if (files.length === 0)
      return 0;
    return files.reduce((acc, file) => acc + file.size, 0);
  }

  private removeLargestFile(files: File[]): File[] {
    if (files.length === 0)
      return files;
    let largestFile = files.reduce((prev, current) => (prev.size > current.size) ? prev : current);
    return files.filter(file => file !== largestFile);
  }

  private displayOversizedFilesAlert(oversizedFiles: File[]) {
    this.alertService.displayMessageAlert(
      AlertType.ERROR,
      this.translate.instant('page.chat.max-file-size-exceeded',
        { max: this.FILE_MAX_SIZE_MB, fileNames: oversizedFiles.map(f => f.name).join(', ') }),
    );
  }
}
