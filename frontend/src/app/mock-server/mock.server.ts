import { Injectable } from '@angular/core';
import { UserProfile, GroupProfile, Profile } from "@app/profiles/profile.interface"
import { testConversations } from './test-conversations';
import { testProfiles } from './test-profiles';
import { ServerConversation } from './server-conversation.interface';
import { Conversation } from '@app/conversations/conversation.interface';
import { profileMatchesSearch, serverToClientProfile, serverToClientUserProfile } from '@app/profiles/profileUtils';
import { Message } from '@app/messages/message.interface';
import { testMessages } from './test-messages';
import { Observable, of, delay, throwError } from 'rxjs';
import { ServerMessage } from './server-message.interface';

@Injectable({
  providedIn: 'root'
})
export class MockServer {
  public readonly userId = 20;

  // PRIVATE
  private delayedResponse(ofParam: any) {
    return of(ofParam).pipe(delay(1000 + Math.random() * 1000)); // throwError(() => ({status: 0, message: "67" })).pipe(delay(1000 + Math.random() * 1000));
  }

  private getUserConversations(userId: number = this.userId): ServerConversation[] {
    // Find user's conversations
    let foundConversations: ServerConversation[] = testConversations.filter((value) =>
              (value.participant1Id == userId || value.participant2Id == userId));

    return foundConversations;
  }

  private getConversationMessages(convId: number, startMessageId: number = -1, messageNumber: number = 25, older: boolean = true, includeGivenId = false) {
    // Handle error
    if (this.getUserConversations().find((conv) =>
      conv.id == convId && (conv.participant1Id == this.userId || conv.participant2Id == this.userId)
    ) === undefined) throw new Error("apiGetConversationMessages: conversation ID not found, or lacking permission");

    // Get the proper conversation array
    let convMessages: Message[] = testMessages
      .filter((msg) => msg.conversationId == convId)
      .sort((a, b) => b.id - a.id)  // newest to oldest
      .map((msg) => ({
        ...msg,
        timestamp: new Date(msg.isoTimestamp),
        isOwn: this.userId == msg.senderId,
        repliedText: this.getRepliedText(msg)
      }));

    // Specify the index of the start message
    let startIndex;
    if (startMessageId == -1) startIndex = -1;  // it will get incremented later, resulting in proper load which includes the very last (newest) message
    else {
      startIndex = convMessages.findIndex((msg) => msg.id == startMessageId);  // This should be corrected in the future - we don't have to find the exact ID, just the nearest one (DB will help)
      if (startIndex == -1) throw new Error("apiGetConversationMessages: newestMessageId not found");
    }

    let endIndex;
    if (older) {
      // Specify how many older messages are left in the array
      if (!includeGivenId) startIndex += 1;  // if we don't want to load the message that already exists in the chat - we go one more to get the nearest NOT LOADED one
      const msgAmount = convMessages.length - startIndex;
      // Specify the endIndex
      endIndex = startIndex + Math.min((msgAmount - 1), messageNumber);
      // Return the correct array fragment
      return convMessages.slice(startIndex, endIndex + 1).reverse();
    }
    else {
      if (!includeGivenId) startIndex -= 1;
      const msgAmount = startIndex + 1;
      endIndex = startIndex - Math.min((msgAmount - 1), messageNumber);
      return convMessages.slice(endIndex, startIndex + 1).reverse();
    }
  }

  private getMessageById(id: number) {
    let msg = testMessages.find((m) => m.id == id);
    return msg;
  }

  private getRepliedText(message: ServerMessage) {  // TODO: (BACKEND) CHECK IF THE USER SHOULD HAVE ACCESS TO THAT MESSAGE!
    if (message.repliedId === undefined) return undefined;
    let repliedMessage = this.getMessageById(message.repliedId);
    if (repliedMessage === undefined) return "<i>Deleted message</i>";
    if (repliedMessage.text === undefined) return "<i>Empty message</i>";
    return repliedMessage.text;
  }

  // PUBLIC (API)

  apiGetCurrentProfile(): Observable<UserProfile> {
    let found = testProfiles.find((value) => value.id === this.userId);
    if (found === undefined) throw new Error("getCurrentProfile - not found");
    return this.delayedResponse(found);
  }

  apiGetUserKnownProfiles(): Observable<Map<number, Profile>> {
    let userConversations = this.getUserConversations(this.userId);
    let map = new Map<number, Profile>();

    userConversations.forEach((conversation) => {
      // For each conversation where the client's own user is a participant,
      // find the other user's profile
      let otherParticipantProfile = testProfiles.find((profile) => 
        (profile.id == conversation.participant1Id || profile.id == conversation.participant2Id) && profile.id !== this.userId
      );
      if (otherParticipantProfile === undefined) {
        throw new Error("Profile ID existing in conversation not found - apiGetUserKnownProfiles");
      }
      map.set(otherParticipantProfile.id, serverToClientProfile(otherParticipantProfile));
    });

    let userProfile = testProfiles.find((profile) => profile.id == this.userId);
    if (userProfile === undefined) throw new Error("WTF-class critical error: Current user profile not found");
    map.set(this.userId, userProfile);
    return this.delayedResponse(map);
  }

  // apiGetUserKnownProfileNames(): Map<number, string> {
  //   let userConversations = this.getUserConversations(this.userId);
  //   let map = new Map<number, string>();

  //   userConversations.forEach((conversation) => {
  //     let otherParticipantProfile = testProfiles.find((profile) => 
  //       (profile.id == conversation.participant1Id || profile.id == conversation.participant2Id) && profile.id !== this.userId
  //     );
  //     if (otherParticipantProfile === undefined) throw new Error("Profile ID existing in conversation not found - apiGetUserKnownProfiles");
  //     map.set(otherParticipantProfile?.id, getVisibleName(otherParticipantProfile, true));
  //   });
  //   return map;
  // }

  // TODO: (IN THE FUTURE BACKEND) CONSIDER MAKING THE BACKEND RETURN BOTH CONVERSATIONS AND CORRESPONDING PROFILES IN ONE CALL -
  // JUST CREATE SOMETHING LIKE CONVERSATION-PROFILE DTO AND RETURN A LIST OF THEM - SERVER OPTIMALIZATION!
  apiGetUserConversations() : Observable<Conversation[]> {
    let rawConversations = this.getUserConversations();

    let convertedConversations: Conversation[] = [];
    for (let raw of rawConversations) {
      let participantId = raw.participant1Id == this.userId ? raw.participant2Id : raw.participant1Id;
      convertedConversations.push({
        id: raw.id,
        participantId: participantId,
        newestMessageReadId: raw.newestMessageReadId
      });
    }
    return this.delayedResponse(convertedConversations);
  }

  apiGetUserConversationsLastMessages() {
    let conversations = this.getUserConversations();
    let resultMap = new Map<number, Message | null>();
    for (let conv of conversations) {
      let msg;
      let msgs = this.getConversationMessages(conv.id, -1, 0, true);
      if (msgs.length == 0) msg = null;
      else msg = msgs[0];

      resultMap.set(conv.id, msg);
    }
    return this.delayedResponse(resultMap);
  }

  apiGetUserMessages(maxMessagesPerConversation: number = 20): Observable<Map<number, Message[]>> {
    let conversations = this.getUserConversations();

    let map = new Map<number, Message[]>();
    for (let conv of conversations) {
      let limit = maxMessagesPerConversation;  // implement in the future
      let msgArray: Message[] = testMessages
        .filter((msg) => msg.conversationId === conv.id)
        .sort((a, b) => a.id - b.id)
        .map((msg) => ({...msg, timestamp: new Date(msg.isoTimestamp), isOwn: this.userId == msg.senderId}));

      map.set(conv.id, msgArray);
    }
    return this.delayedResponse(map);
  }

  // This will be way more efficient with a proper Database system on the server
  apiGetConversationMessages(convId: number, startMessageId: number = -1, messageNumber: number = 25, older: boolean = true, includeGivenId = false) {
    return this.delayedResponse(this.getConversationMessages(convId, startMessageId, messageNumber, older, includeGivenId));
  }

  apiGetSearchedProfiles(search: string, userId: number = this.userId): Observable<Map<number, UserProfile>> {
    if (search == "") return new Observable<Map<number, UserProfile>>();

    search = search.toLowerCase();
    const found: Map<number, UserProfile> = new Map<number, UserProfile>();
    let limit: number = 20;

    for (let profile of testProfiles) {
      if (profileMatchesSearch(profile, search)) {
        
        if (profile.id == userId) continue;
        found.set(profile.id, serverToClientUserProfile(profile));
        limit--;
        if (limit <= 0) break;
      }
    }

    return this.delayedResponse(found);
  }
}
