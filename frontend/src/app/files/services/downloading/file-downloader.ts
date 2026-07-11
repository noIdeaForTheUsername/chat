import { inject, Injectable } from "@angular/core";
import { Capacitor } from "@capacitor/core";
import { FileInfo } from "../../file-types";
import { AndroidFileDownloader } from "./android-file-downloader";
import { isIOS, isPwa } from "@src/app/shared/platform-detection/platformUtils";
import { IOSFileDownloader } from "./ios-file-downloader";

@Injectable({
  providedIn: 'root'
})
export class FileDownloaderService {

  private androidDownloader = inject(AndroidFileDownloader);
  private iosDownloader = inject(IOSFileDownloader);

  private readonly downloadQuery = "?download=true";

  public async downloadFile(file: FileInfo) {
    if (Capacitor.getPlatform() === "android") {
      await this.androidDownloader.download(file, this.downloadQuery);
    }
    else if (isIOS()) {
      await this.iosDownloader.download(file, this.downloadQuery);
    }
    else {
      this.browserFileDownload(file);
    }
  }

  private browserFileDownload(file: FileInfo) {
    const a = document.createElement('a');
    a.href = file.url + this.downloadQuery;
    a.download = file.originalName;
    a.click();
  }
}
