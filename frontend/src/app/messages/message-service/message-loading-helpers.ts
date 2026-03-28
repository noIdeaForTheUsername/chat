import { Message } from '../message.interface';
import { MessageView } from '../message-view.interface';
import { messageToMessageView } from '../message-utils';

export type MetadataUpdateFlags = {
  updateConvNewestMessageId: boolean;
  updateConvOldestMessageId: boolean;
};

export function mergeLoadedMessages(
  loadedMessages: Message[],
  displayedMessages: MessageView[],
  older: boolean
): Message[] {
  return older
    ? [...loadedMessages, ...displayedMessages]
    : [...displayedMessages, ...loadedMessages];
}

export function trimOverflowMessages(
  messages: Message[],
  maxMessagesDisplayed: number,
  previousLowestDisplayedId: number,
  previousHighestDisplayedId: number,
): Message[] {
  const trimmedMessages = [...messages];
  const overflow = trimmedMessages.length - maxMessagesDisplayed;

  if (overflow <= 0) return trimmedMessages;

  if (trimmedMessages[0].globalId < previousLowestDisplayedId) {
    trimmedMessages.splice(trimmedMessages.length - overflow, overflow);
  }
  else if (trimmedMessages[trimmedMessages.length - 1].globalId > previousHighestDisplayedId) {
    trimmedMessages.splice(0, overflow);
  }

  return trimmedMessages;
}

export function mapMessagesToView(
  messages: Message[],
  currentUserId: number
): MessageView[] {
  const msgViews: MessageView[] = [];

  for (let i = 0; i < messages.length; i++) {
    msgViews[i] = messageToMessageView(
      messages[i],
      currentUserId,
      i > 0 ? msgViews[i - 1] : undefined
    );
  }

  return msgViews;
}

export function getMetadataUpdateFlags(
  older: boolean,
  loadedCount: number,
  requestedCount: number,
  loadsCount: number
): MetadataUpdateFlags {
  return {
    updateConvNewestMessageId: (!older && loadedCount < requestedCount) || loadsCount === 0,
    updateConvOldestMessageId: older && loadedCount < requestedCount,
  };
}
