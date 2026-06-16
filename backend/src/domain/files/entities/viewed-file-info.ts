import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity("viewed_files_info")
export class ViewedFileInfo {
  @ViewColumn()
  uuid: string;

  @ViewColumn({ name: "message_id" })
  messageId: number;

  @ViewColumn({ name: "uploaded_at" })
  uploadedAt: Date;

  @ViewColumn({ name: "original_name", })
  originalName: string;

  @ViewColumn({ name: "mime_type", })
  mimeType: string;

  @ViewColumn({ name: "mime_type_trusted", })
  mimeTypeTrusted: boolean;

  @ViewColumn({ name: "size_in_bytes", })
  sizeInBytes: number;

  // viewer is anyone with access to the conversation

  @ViewColumn({ name: "viewer_id" })
  viewerId: number;
}