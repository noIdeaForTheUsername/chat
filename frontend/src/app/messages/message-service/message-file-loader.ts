import { inject, Injectable } from "@angular/core";
import { MessageStateStore } from "./message-state.store";
import { BaseFileInfo, FileInfo } from "@src/app/files/file-types";
import { FileInfoApi } from "@src/app/files/file-info-api.service";
import { MessageView } from "../message-view.interface";
import { FileInfoMapperService } from "@src/app/files/file-info-mapper.service";

@Injectable({
  providedIn: 'root',
})
export class MessageFileLoader {

  private readonly fileInfoApi = inject(FileInfoApi);
  private readonly fileInfoMapper = inject(FileInfoMapperService);
  private readonly state = inject(MessageStateStore);
  // files to be added to messages that haven't arrived yet
  private pendingFiles: Map<number, FileInfo[]> = new Map();  // key: messageId, value: files


  public async loadFilesForMessages(messages: MessageView[], conversationId: number) {
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

  public addPendingFilesToMessage(message: MessageView): MessageView {
    const pendingFiles = this.pendingFiles.get(message.globalId);
    if (!pendingFiles) {
      return message;
    }
    return this.addFilesIntoMessage(pendingFiles, message);
  }

  // This function mutates the state's displayed messages array directly
  public async handleIncomingFilesInfo(filesInfo: (BaseFileInfo | FileInfo)[]) {
    let mappedFilesInfo = filesInfo.map(f => this.fileInfoMapper.mapBaseFileInfo(f));
    let displayedMessagesCopy = [...this.state.displayedMessages()];
    let mutatedLatestMessage = false;

    for (const fileInfo of mappedFilesInfo) {
      let fileMessageIndex = displayedMessagesCopy.findIndex(m => m.globalId == fileInfo.messageId);
      if (fileMessageIndex === -1) {
        this.addPendingFile(fileInfo);
      }
      else {
        if (fileMessageIndex === displayedMessagesCopy.length - 1)
          mutatedLatestMessage = true;

        displayedMessagesCopy[fileMessageIndex] =
          this.addFileIntoMessage(fileInfo, displayedMessagesCopy[fileMessageIndex]);
      }
    }
    this.state.displayedMessages.set(displayedMessagesCopy);
    if (mutatedLatestMessage)
      this.state.newMessageAppeared.next();
  }



  private addPendingFile(fileInfo: FileInfo) {
    let existingPendingFiles = this.pendingFiles.get(fileInfo.messageId) || [];
    this.pendingFiles.set(fileInfo.messageId, [...existingPendingFiles, fileInfo as FileInfo]);
  }

  private addFilesIntoMessages(filesInfo: (FileInfo | BaseFileInfo)[], messages: MessageView[]) {
    let messagesCopy = [...messages];
    for (let i = 0; i < filesInfo.length; i++) {
      // find file's message
      const fileInfo = filesInfo[i];
      const messageIndex = messagesCopy.findIndex(m => m.globalId == fileInfo.messageId);
      if (messageIndex === -1)
        continue;
      
      const message = messagesCopy[messageIndex];
      const updated = this.addFileIntoMessage(fileInfo, message);
      messagesCopy[messageIndex] = updated;
    }
    return messagesCopy;
  };

  private addFilesIntoMessage(filesInfo: (FileInfo | BaseFileInfo)[], message: MessageView): MessageView {
    for (let i = 0; i < filesInfo.length; i++) {
      message = this.addFileIntoMessage(filesInfo[i], message);
    }
    return message;
  }

  private addFileIntoMessage(fileInfo: FileInfo | BaseFileInfo, message: MessageView): MessageView {
    // check if file already exists in message
    if (message.files?.some(f => f.uuid == fileInfo.uuid))
      return message;

    // map BaseFileInfo to FileInfo if necessary
    fileInfo = this.fileInfoMapper.mapBaseFileInfo(fileInfo);

    let updated = {...message};
    if (!updated.files)
      updated.files = [];
    console.log("adding file to message: ", fileInfo);
    updated.files.push(fileInfo as FileInfo);
    return updated;
  }
}