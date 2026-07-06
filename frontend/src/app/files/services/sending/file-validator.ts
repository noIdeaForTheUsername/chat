import { inject, Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { AlertService } from "@src/app/alerts/alert-service/alert.service";
import { AlertType } from "@src/app/alerts/alert-type.enum";

@Injectable({
  providedIn: 'root',
})
export class FilesValidatorService {

  private readonly FILE_MAX_SIZE_MB = 99;
  private readonly ALL_FILES_MAX_SIZE_MB = 99; 
  public static readonly MAX_FILES_PER_MESSAGE = 30;
  

  private alertService = inject(AlertService);
  private translate = inject(TranslateService);

  // returns valid files only; displays alerts about what went wrong with invalid files
  // supposed to be called when adding files to the message
  public validateSelectedMessageFiles(files: File[]): File[] {
    if (!this.validateAmount(files))
      return [];
    return files;
  }

  // supposed to be called just before sending fully processed, compressed files
  public validateSentMessageFiles(files: File[]): File[] | false {
    let validFiles = this.filterOversizedFiles(files);
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

  private filterOversizedFiles(files: File[]): File[] {
    let validFiles: File[] = [];
    let oversizedFileNames: string[] = [];
    const maxBytes = this.FILE_MAX_SIZE_MB * 1024 * 1024;
    for (let file of files) {
      if (file.size > maxBytes)
        oversizedFileNames.push(file.name);
      else
        validFiles.push(file);
    }
    if (oversizedFileNames.length > 0) {
      this.alertService.displayMessageAlert(
        AlertType.ERROR,
        this.translate.instant('page.chat.max-file-size-exceeded',
          { max: this.FILE_MAX_SIZE_MB, fileNames: oversizedFileNames.join(', ') }),
      );
    }
    return validFiles;
  }

  private limitTotalFileSize(files: File[]): File[] {
    let limitedFiles = [...files];
    while (this.getFilesMbSize(limitedFiles) > this.ALL_FILES_MAX_SIZE_MB) {
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

  private getFilesMbSize(files: File[]): number {
    if (files.length === 0)
      return 0;
    return files.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024);
  }

  private removeLargestFile(files: File[]): File[] {
    if (files.length === 0)
      return files;
    let largestFile = files.reduce((prev, current) => (prev.size > current.size) ? prev : current);
    return files.filter(file => file !== largestFile);
  }
}
