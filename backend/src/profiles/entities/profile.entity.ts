import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("profiles")
export class Profile {
  @PrimaryColumn({ update: false })
  id: number;

  @Column()
  name: string;

  @Column()
  bio: string;
}