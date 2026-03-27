import { Injectable } from "@angular/core";
import { MessageView } from "../message-view.interface";
import { Message } from "../message.interface";
import { BackendMessageApi } from "./backend-message-api";

type ReplyPreviewStateAdapter = {
  getDisplayedMessages: () => MessageView[];
  updateDisplayedMessages: (updater: (msgs: MessageView[]) => MessageView[]) => void;
};

@Injectable({
  providedIn: 'root',
})
export class ReplyPreviewManager {

  private state?: ReplyPreviewStateAdapter;

  constructor(private api: BackendMessageApi) {}

  connect(state: ReplyPreviewStateAdapter) {
    this.state = state;
  }

  disconnect() {
    this.state = undefined;
  }

  private getDisplayedMessages() {
    return this.state?.getDisplayedMessages() ?? [];
  }

  public loadMessagePreviews(currentConvId: number, highestDisplayedId: number, lowestDisplayedId: number) {
    if (!this.state) return;

    const repliedIds = this.getDisplayedMessages()
      .filter(msg => msg.repliedId !== undefined)
      .map(msg => msg.repliedId!);

    const repliedIdsExistingLocally: number[] = [];
    const idsToLoad: number[] = [];

    repliedIds.forEach(id => {
      if (id <= highestDisplayedId && id >= lowestDisplayedId) {
        if (!repliedIdsExistingLocally.includes(id)) repliedIdsExistingLocally.push(id);
        return;
      }

      if (!idsToLoad.includes(id)) idsToLoad.push(id);
    });

    const messagesWithRepliedTexts = repliedIdsExistingLocally
      .map(id => this.getDisplayedMessages().find(msg => msg.globalId === id))
      .filter((msg): msg is MessageView => msg !== undefined);

    this.addPreviews(messagesWithRepliedTexts);

    if (idsToLoad.length > 0) {
      this.api.getMessagesByIds(idsToLoad, currentConvId).subscribe({
        next: (msgs: Message[]) => this.addPreviews(msgs),
      });
    }
  }

  public loadSingleMessagePreview(message: Message, highestDisplayedId: number, lowestDisplayedId: number) {
    if (!this.state) return;
    if (!message.repliedId) return;

    if (message.repliedId > highestDisplayedId || message.repliedId < lowestDisplayedId) {
      this.api.getMessageById(message.repliedId, message.conversationId).subscribe({
        next: (msg: Message) => this.addPreviews(msg),
      });
      return;
    }

    const found = this.getDisplayedMessages().find(msg => msg.globalId === message.repliedId);
    if (found) this.addPreviews(found);
  }

  public addPreviews(messageWithRepliedTextOrArray: Message | Message[]) {
    if (!this.state) return;

    this.state.updateDisplayedMessages((msgs) => {
      const messagesWithRepliedTexts = Array.isArray(messageWithRepliedTextOrArray)
        ? messageWithRepliedTextOrArray
        : [messageWithRepliedTextOrArray];

      return msgs.map(msg => {
        const messageWithRepliedText = messagesWithRepliedTexts.find(
          m => m.globalId === msg.repliedId
        );

        if (!messageWithRepliedText) return msg;

        return {
          ...msg,
          repliedText: messageWithRepliedText.text?.trim() || undefined,
        };
      });
    });
  }
}
