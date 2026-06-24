import { inject, Injectable } from "@angular/core";
import { MessageStateStore } from "./message-state.store";
import { FileInfo } from "@src/app/files/file-types";
import { FileInfoApi } from "@src/app/files/file-info-api.service";
import { MessageView } from "../message-view.interface";

@Injectable({
  providedIn: 'root',
})
export class MessageFileLoader {

  private readonly fileInfoApi = inject(FileInfoApi);

  constructor(
    
  ) {}

  // this function
  async loadFilesForMessages(messages: MessageView[], conversationId: number) {
    let minMessageId = messages.reduce((minId, message) => Math.min(minId, message.globalId), messages[0]?.globalId);
    let maxMessageId = messages.reduce((maxId, message) => Math.max(maxId, message.globalId), messages[0]?.globalId);

    return new Promise<MessageView[]>((resolve, reject) => {
      this.fileInfoApi.loadFilesForMessages(minMessageId, maxMessageId, conversationId).subscribe({
        next: (filesInfo: FileInfo[]) => {
          let messagesWithFiles = this.addFilesIntoMessages(filesInfo, messages);
          resolve(messagesWithFiles);
        },
        error: (e) => {
          reject("Failed to load message files: " + e);
        }
      });
    });
  }

  private addFilesIntoMessages(filesInfo: FileInfo[], messages: MessageView[]) {
    let messagesCopy = [...messages];
    for (let i = 0; i < filesInfo.length; i++) {
      // find file's message
      const fileInfo = filesInfo[i];
      const messageIndex = messagesCopy.findIndex(m => m.globalId == fileInfo.messageId);
      if (messageIndex === -1)
        continue;
      const message = messagesCopy[messageIndex];
      
      // check if file already exists in message
      if (message.files?.some(f => f.uuid == fileInfo.uuid))
        continue;
      

      let updated = {...message};
      if (!updated.files)
        updated.files = [];
      console.log("adding file to message: ", fileInfo);
      updated.files.push(fileInfo);
      messagesCopy[messageIndex] = updated;
    }
    return messagesCopy;
  };
}