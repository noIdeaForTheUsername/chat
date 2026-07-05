import { inject, Injectable } from "@angular/core";
import { MessageView } from "../message-view.interface";
import { Message } from "../message.interface";
import { BackendMessageApi } from "./backend-message-api";
import { MessageStateStore } from "./message-state.store";

@Injectable({
  providedIn: 'root',
})
export class ReplyPreviewManager {
  private readonly state = inject(MessageStateStore);
  private api = inject(BackendMessageApi);

  constructor() {}

  private getDisplayedMessages() {
    return this.state.displayedMessages();
  }

  public loadMessagePreviews(currentConvId: number, highestDisplayedId: number, lowestDisplayedId: number) {
    const repliedIds = this.getDisplayedMessages()
      .filter(msg => !!msg.repliedId)  // reject null/falsy values
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

  private addPreviews(messageWithRepliedTextOrArray: Message | Message[]) {
    this.state.displayedMessages.update((msgs) => {
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
          repliedText: this.getRepliedTextFromMessage(messageWithRepliedText),
        };
      });
    });
    this.state.messagesDidRefresh.next();
  }

  getRepliedTextFromMessage(messageWithRepliedText: Message | MessageView): string | undefined {
    let text = messageWithRepliedText.text?.trim();
    if (text && text.length > 0) {
      return text;
    }
    else if (messageWithRepliedText.files) {
      if (messageWithRepliedText.files.every(f => f.type === 'image' || f.type === "video"))
        return "🖼️";
      else
        return "📄";
    }
    else {
      return undefined;
    }
  }
}
