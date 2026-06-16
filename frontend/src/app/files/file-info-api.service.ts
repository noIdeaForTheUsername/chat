import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map } from "rxjs";
import { ApiUrlService } from "../http/url.service";
import { BaseFileInfo, FileInfo } from "./file-types";

@Injectable({
  providedIn: 'root',
})
export class FileInfoApi {

  constructor(
    private readonly http: HttpClient,
    private readonly apiUrlService: ApiUrlService,
  ) { }

  loadFilesForMessages(minMessageId: number, maxMessageId: number, conversationId: number) {
    return this.http.get<BaseFileInfo[]>(`/conversations/${conversationId}/file-info`, {
      params: {
        minMessageId,
        maxMessageId
      }
    }).pipe(
      map(filesInfo => filesInfo.map(fileInfo => ({
        ...fileInfo,
        url: this.apiUrlService.apiUrl + "/uploads/" + fileInfo.uuid
      } as FileInfo)))
    );
  }
}