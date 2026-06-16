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

  loadFilesForMessages(minMessageId: number, maxMessageId: number, conversationId: number) {
    this.fileInfoApi.loadFilesForMessages(minMessageId, maxMessageId, conversationId).subscribe({
      next: (filesInfo: FileInfo[]) => {
        this.addFilesIntoMessages(filesInfo);
      }
    });
  }

  private addFilesIntoMessages(filesInfo: FileInfo[]) {
    this.state.displayedMessages.update(messages => {
      for (let i = 0; i < messages.length; i++) {
        const originalMessage = messages[i];
        const fileForMessage = filesInfo.find(file => file.messageId == originalMessage.globalId);
        if (!fileForMessage)
          continue;

        let updated = {...originalMessage};
        if (!updated.files)
          updated.files = [];
        updated.files.push(fileForMessage);
        messages[i] = updated;
      }
      return [...messages];
    });
  }
}