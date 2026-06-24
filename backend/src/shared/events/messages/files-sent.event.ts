import { FileInfoResponse } from "src/application/files/file-interfaces";

export class FilesSentEvent {
  constructor(
    public readonly senderId: number,
    public readonly receiverIds: number[],
    public readonly conversationId: number,
    public readonly messageId: number,
    public readonly filesInfo: FileInfoResponse[]
  ) {}
}