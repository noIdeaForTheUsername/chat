import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('profiles')
export class Profile {
  @PrimaryColumn({ update: false })
  id: number;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ default: false, name: 'phone_number_public' })
  phoneNumberPublic: boolean;

  @Column({ default: false, name: 'email_public' })
  emailPublic: boolean;
}
