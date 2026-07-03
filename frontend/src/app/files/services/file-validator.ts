import { inject, Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { AlertService } from "@src/app/alerts/alert-service/alert.service";
import { AlertType } from "@src/app/alerts/alert-type.enum";

@Injectable({
  providedIn: 'root',
})
export class FilesValidatorService {

  private readonly MAX_FILE_SIZE_MB = 2500;
  private readonly MAX_FILES_PER_MESSAGE = 30;
  
  private alertService = inject(AlertService);
  private translate = inject(TranslateService);

  // returns valid files only; displays alerts about what went wrong with invalid files
  public validateAndFilterSingleMessageFiles(files: File[]): File[] {
    if (!this.validateAmount(files))
      return [];

    let validFiles = this.filterOversizedFiles(files);
    return validFiles;
  }

  private validateAmount(files: File[]): boolean {
    if (files.length > this.MAX_FILES_PER_MESSAGE) {
      this.alertService.displayMessageAlert(
        AlertType.ERROR,
        this.translate.instant('page.chat.max-files-exceeded', { max: this.MAX_FILES_PER_MESSAGE }),
      );
      return false;
    }
    return true;
  }

  private filterOversizedFiles(files: File[]): File[] {
    let validFiles: File[] = [];
    let oversizedFileNames: string[] = [];
    const maxBytes = this.MAX_FILE_SIZE_MB * 1024 * 1024;
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
          { max: this.MAX_FILE_SIZE_MB, fileNames: oversizedFileNames.join(', ') }),
      );
    }
    return validFiles;
  }
}