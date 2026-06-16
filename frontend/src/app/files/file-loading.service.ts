// import { Injectable } from "@angular/core";
// import { FileInfoApi } from "./file-info-api.service";
// import { FileInfo } from "./file-types";

// @Injectable({
//   providedIn: 'root',
// })
// export class FileLoadingService {

//   constructor(
//     private readonly fileInfoApi: FileInfoApi,
//   ) {}
  
//   async loadFilesForMessages(minMessageId: number, maxMessageId: number, conversationId: number) {
//     this.fileInfoApi.loadFilesForMessages(minMessageId, maxMessageId, conversationId).subscribe({
//       next: (filesInfo: FileInfo[]) => {
//         // Handle the loaded files
//       }
//     });
//   }
// }