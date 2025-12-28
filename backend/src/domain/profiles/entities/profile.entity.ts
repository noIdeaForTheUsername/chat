import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('profiles')
export class Profile {
  @PrimaryColumn({ update: false })
  id: number;

  @Column()
  name: string;

  @Column()
  bio: string;

  @Column({ default: false, name: 'phone_number_public' })
  phoneNumberPublic: boolean;

  @Column({ default: false, name: 'email_public' })
  emailPublic: boolean;
}
