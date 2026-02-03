import { MessageView } from "../chat-page/message-card-component/message-view.interface";
import { Message } from "../message.interface";
import { BackendMessageApi } from "./backend-message-api";
import { MessageService } from "./message.service";

export class ReplyPreviewManager {

  // this class modifies "displayedMessages" in the service directly
  constructor(private s: MessageService, private api: BackendMessageApi) {}

  public loadMessagePreviews(currentConvId: number, highestDisplayedId: number, lowestDisplayedId: number) {  
    const repliedIds = this.s.displayedMessages().filter(msg => msg.repliedId).map(msg => msg.repliedId!);
    let repliedIdsExistingLocally: number[] = [];
    let idsToLoad: number[] = [];
    repliedIds.forEach(id => {
      // case where the target message is already loaded and displayed
      if (id <= highestDisplayedId && id >= lowestDisplayedId) {
        if (!repliedIdsExistingLocally.includes(id)) repliedIdsExistingLocally.push(id);
      }
      else {  // case where the target message isn't loaded
        if (!idsToLoad.includes(id)) idsToLoad.push(id);
      }
    });

    // Update locallly available messages
    let messagesWithRepliedTexts = repliedIdsExistingLocally.map(id => 
      this.s.displayedMessages().find(msg => msg.globalId == id)
    ).filter(msg =>
      msg !== undefined
    );
    this.addPreviews(messagesWithRepliedTexts);

    // Load missing messages
    if (idsToLoad.length > 0) {
      this.api.getMessagesByIds(idsToLoad, currentConvId).subscribe({
        next: (msgs: Message[]) => {
          this.addPreviews(msgs);
        }
      });
    }
  }

  public loadSingleMessagePreview(message: Message, highestDisplayedId: number, lowestDisplayedId: number) {
    if (!message.repliedId) return;
    if (message.repliedId > highestDisplayedId || message.repliedId < lowestDisplayedId) {
      // Load message from the backend
      this.api.getMessageById(message.repliedId, message.conversationId).subscribe({
        next: (msg: Message) => {
          this.addPreviews(msg);
        }
      });
    }
    else {
      // Get message from the currently displayed list
      const found = this.s.displayedMessages().find(msg => msg.globalId == message.repliedId);
      if (found) this.addPreviews(found);
    }
  }

  public addPreviews(messageWithRepliedTextOrArray: Message | Message[]) {
    this.s.displayedMessages.update((msgs) => {
      // normalize param to array
      let messagesWithRepliedTexts: Message[];
      if (Array.isArray(messageWithRepliedTextOrArray)) {
        messagesWithRepliedTexts = messageWithRepliedTextOrArray;
      } else {
        messagesWithRepliedTexts = [messageWithRepliedTextOrArray];
      }

      // attach replied texts to existing messages
      for (let i = 0; i < messagesWithRepliedTexts.length; i++) {
        const messageWithRepliedText = messagesWithRepliedTexts[i];
        for (let j = 0; j < msgs.length; j++) {
          if (msgs[j].repliedId == messageWithRepliedText.globalId) {
            msgs[j] = {
              ...msgs[j],
              repliedText: messageWithRepliedText.text?.trim() || undefined,
            };
          }
          // not breaking, there might be multiple messages replying to the same one
        }
      }
      return msgs;
    });
  }
}

