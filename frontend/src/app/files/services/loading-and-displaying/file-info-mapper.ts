import { inject, Injectable } from "@angular/core";
import { BaseFileInfo, FileInfo } from "../../file-types";
import { ApiUrlService } from "../../../http/url.service";

@Injectable({
  providedIn: 'root',
})
export class FileInfoMapperService {

  constructor(
    private readonly apiUrlService: ApiUrlService,
  ) {}
  

  mapBaseFileInfo(baseFileInfo: BaseFileInfo): FileInfo {
    return {
      ...baseFileInfo,
      url: this.apiUrlService.apiUrl + "/uploads/" + baseFileInfo.uuid
    } as FileInfo;
  }
}