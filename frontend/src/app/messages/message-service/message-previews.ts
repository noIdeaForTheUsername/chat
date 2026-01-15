import { MessageView } from "../chat-page/message-card-component/message-view.interface";
import { Message } from "../message.interface";
import { BackendMessageApi } from "./backend-message-api";
import { MessageService } from "./message.service";

export class MessagePreviewManager {

  constructor(private s: MessageService, private api: BackendMessageApi) {}

  // modifies "displayedMessages" in the service directly
  public loadMessagePreviews(currentConvId: number, highestDisplayedId: number, lowestDisplayedId: number) {  
    const repliedIds = this.s.displayedMessages().filter(msg => msg.repliedId).map(msg => msg.repliedId!);
    repliedIds.forEach(id => {
      if (id > highestDisplayedId || id < lowestDisplayedId) {
        // Load message from the backend
        this.api.getMessageById(id, currentConvId).subscribe({
          next: (msg: Message) => {
            this.addPreview(msg);
          }
        });
      }
      else {
        // Get message from the currently displayed list
        // (and if it's not there, it was probably deleted - do nothing then)
        const found = this.s.displayedMessages().find(msg => msg.globalId == id);
        if (found) this.addPreview(found);
      }
    });
  }

  public loadSingleMessagePreview(message: Message, highestDisplayedId: number, lowestDisplayedId: number) {
    if (!message.repliedId) return;
    if (message.repliedId > highestDisplayedId || message.repliedId < lowestDisplayedId) {
      // Load message from the backend
      this.api.getMessageById(message.repliedId, message.conversationId).subscribe({
        next: (msg: Message) => {
          this.addPreview(msg);
        }
      });
    }
    else {
      // Get message from the currently displayed list
      const found = this.s.displayedMessages().find(msg => msg.globalId == message.repliedId);
      if (found) this.addPreview(found);
    }
  }

  // modifies "displayedMessages" in the service directly
  public addPreview(messageWithRepliedText: Message) {
    this.s.displayedMessages.update((msgs) => {
      for (let i = 0; i < msgs.length; i++) {
        if (msgs[i].repliedId == messageWithRepliedText.globalId) {
          msgs[i] = {
            ...msgs[i],
            repliedText: messageWithRepliedText.text
          };
          return msgs;
        }
      }
      return msgs;
    });
}
}

