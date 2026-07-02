import { Injectable } from "@angular/core";
import { FileInfo } from "../file-types";
import { isFirefox, isMobile } from "@src/app/shared/platform-detection/platformUtils";

@Injectable({
  providedIn: 'root'
})
export class FileDownloaderService {

  private readonly downloadQuery = "?download=true";

  public downloadFile(file: FileInfo) {
    const a = document.createElement('a');
    a.href = file.url + this.downloadQuery;
    a.download = file.originalName;
    document.body.appendChild(a);
    if (isFirefox() && !isMobile()) {
      // firefox for some reason reloads the app without this
      a.target = "_blank";
    }
    a.click();
    document.body.removeChild(a);
  }
}