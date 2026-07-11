import { inject, Injectable } from "@angular/core";
import { FileInfo } from "../../file-types";
import { ToastController } from "@ionic/angular/standalone";
import { TranslateService } from "@ngx-translate/core";

@Injectable({
  providedIn: 'root'
})
export class IOSFileDownloader {

  private readonly activeDownloads = new Set<string>();
  private translate = inject(TranslateService);
  
  constructor(private toastCtrl: ToastController) {}

  public async download(file: FileInfo, downloadQuery?: string) {
    if (this.activeDownloads.has(file.url))
      return await this.showTranslatedToast("file-toast.already-downloading");
    else
      await this.showTranslatedToast("file-toast.download-started");

    this.activeDownloads.add(file.url);
    const response = await fetch(file.url + (downloadQuery ?? ""));
    const blob = await response.blob();

    const mappedFile = new File([blob], file.originalName, {
      type: blob.type
    });

    this.activeDownloads.delete(file.url);

    await navigator.share({
      files: [mappedFile]
    });
  }

  private async showTranslatedToast(messageKey: string) {
    const toast = await this.toastCtrl.create({
      message: this.translate.instant(messageKey),
      duration: 1500,
      position: "bottom",
    });

    await toast.present();
  }
}