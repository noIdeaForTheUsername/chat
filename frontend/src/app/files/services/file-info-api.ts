import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map } from "rxjs";
import { ApiUrlService } from "../../http/url.service";
import { BaseFileInfo, FileInfo } from "../file-types";
import { FileInfoMapperService } from "./file-info-mapper";

@Injectable({
  providedIn: 'root',
})
export class FileInfoApi {

  constructor(
    private readonly http: HttpClient,
    private readonly fileInfoMapper: FileInfoMapperService
  ) { }

  loadFilesForMessages(minMessageId: number, maxMessageId: number, conversationId: number) {
    return this.http.get<BaseFileInfo[]>(`/conversations/${conversationId}/file-info`, {
      params: {
        minMessageId,
        maxMessageId
      }
    }).pipe(
      map(filesInfo => filesInfo.map(f => this.fileInfoMapper.mapBaseFileInfo(f)))
    );
  }
}