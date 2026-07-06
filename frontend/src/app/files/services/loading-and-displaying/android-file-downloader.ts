import { inject, Injectable } from "@angular/core";
import { AlertService } from "@src/app/alerts/alert-service/alert.service";
import { FileInfo } from "../../file-types";
import { AlertType } from "@src/app/alerts/alert-type.enum";
import { TranslateService } from "@ngx-translate/core";
import { Filesystem, Directory, PermissionStatus } from "@capacitor/filesystem";
import { FileTransfer } from "@capacitor/file-transfer";
import { Toast } from "@capacitor/toast";

@Injectable({
  providedIn: 'root'
})
export class AndroidFileDownloader {

  private alertService = inject(AlertService);
  private translate = inject(TranslateService);

  private readonly downloadDirectoryName = "Documents";
  private permissionGranted = false;

  // URLs currently being downloaded.
  private readonly activeDownloads = new Set<string>();

  public async download(file: FileInfo, downloadQuery?: string) {
    const downloadUrl = file.url + (downloadQuery ?? "");

    if (this.activeDownloads.has(downloadUrl)) {
      await this.showTranslatedToast("file-toast.already-downloading");
      return;
    }
    else {
      this.activeDownloads.add(downloadUrl);
    }

    if (!this.handlePermissionCheck())
      return;

    await this.showTranslatedToast("file-toast.download-started");

    const success = await this.tryDownloadingFile(file, downloadUrl);
    if (success)
      await this.showTranslatedToast("file-toast.download-finished", { catalog: this.downloadDirectoryName });

    this.activeDownloads.delete(downloadUrl);
  }

  

  private async tryDownloadingFile(file: FileInfo, downloadUrl: string) {
    let success = true;
    try {
      const fileInfo = await Filesystem.getUri({
        directory: Directory.Documents,
        path: file.originalName,
      });

      await FileTransfer.downloadFile({
        url: downloadUrl,
        path: fileInfo.uri,
        progress: false,
      });
    }
    catch (error: any) {
      // "Operation failed because file does not exist" - sometimes happens when the file is already downloaded; it's fine
      if (error.code !== "OS-PLUG-FLTR-0007") {
        success = false;
        this.alertService.displayMessageAlert(
          AlertType.ERROR,
          this.translate.instant("error.file-download-failed"),
        );
      }
    }
    return success;
  }

  private async handlePermissionCheck(): Promise<boolean> {
    try {
      await this.requestPermissionIfNeeded();
      return true;
    }
    catch (err) {
      if (err instanceof Error && err.message === "denied") {
        this.alertService.displayMessageAlert(
          AlertType.ERROR,
          this.translate.instant("error.file-no-store-permission"),
        );
      }
      return false;
    }
  }

  private async requestPermissionIfNeeded() {
    if (await this.getPermissionStatus() == false) {
      let result = await Filesystem.requestPermissions();
      let granted = this.processPermissionStatus(result);
      if (!granted)
        throw new Error("denied");
    }
  }

  private async getPermissionStatus(): Promise<boolean> {
    if (this.permissionGranted === true)
      return true;

    let result = await Filesystem.checkPermissions();
    return this.processPermissionStatus(result);
  }

  private processPermissionStatus(permissionStatus: PermissionStatus): boolean {
    switch (permissionStatus.publicStorage) {
      case "granted":
        this.permissionGranted = true;
        return true;
      default:
        return false;
    }
  }

  private async showTranslatedToast(messageKey: string, params?: any) {
    const message = this.translate.instant(messageKey, params);
    await this.showToast(message);
  }

  private async showToast(message: string) {
    await Toast.show({
      text: message,
    });
  }
}