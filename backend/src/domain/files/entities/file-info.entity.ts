import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("files_info")
export class FileInfo {

  @PrimaryColumn({ type: "uuid", update: false })
  uuid: string;

  @Column({ name: "message_id", type: "bigint", nullable: false,
    transformer: { to: _ => _, from: (value) => typeof value === "string" ? Number(value) : value } })
  messageId: number;

  @Column({ name: "uploaded_at", type: "timestamp", nullable: false })
  uploadedAt: Date;

  @Column({ name: "original_name", type: "varchar", nullable: false })
  originalName: string;

  @Column({ name: "mime_type", type: "varchar", nullable: false })
  mimeType: string;

  @Column({ name: "mime_type_trusted", type: "boolean", nullable: false })
  mimeTypeTrusted: boolean;

  @Column({ name: "size_in_bytes", type: "bigint", nullable: false })
  sizeInBytes: number;

  getStoredName() {
    return `${this.uuid}.blob`;
  }
}
