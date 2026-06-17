import { inject, Injectable } from "@angular/core";
import { MessageStateStore } from "./message-state.store";
import { FileInfo } from "@src/app/files/file-types";
import { FileInfoApi } from "@src/app/files/file-info-api.service";

@Injectable({
  providedIn: 'root',
})
export class MessageFileLoader {

  private readonly state = inject(MessageStateStore);
  private readonly fileInfoApi = inject(FileInfoApi);

  constructor(
    
  ) {}

  async loadFilesForMessages(minMessageId: number, maxMessageId: number, conversationId: number) {
    return new Promise<void>((resolve, reject) => {
      this.fileInfoApi.loadFilesForMessages(minMessageId, maxMessageId, conversationId).subscribe({
        next: (filesInfo: FileInfo[]) => {
          this.addFilesIntoMessages(filesInfo);
          resolve();
        },
        error: (e) => {
          reject("Failed to load message files: " + e);
        }
      });
    });
  }

  private addFilesIntoMessages(filesInfo: FileInfo[]) {
    this.state.displayedMessages.update(messages => {
      for (let i = 0; i < filesInfo.length; i++) {
        // find file's message
        const fileInfo = filesInfo[i];
        const messageIndex = messages.findIndex(m => m.globalId == fileInfo.messageId);
        if (messageIndex === -1)
          continue;
        const message = messages[messageIndex];
        
        // check if file already exists in message
        if (message.files?.some(f => f.uuid == fileInfo.uuid))
          continue;
        

        let updated = {...message};
        if (!updated.files)
          updated.files = [];
        console.log("adding file to message: ", fileInfo);
        updated.files.push(fileInfo);
        messages[messageIndex] = updated;
      }
      return [...messages];
    });
  }
}