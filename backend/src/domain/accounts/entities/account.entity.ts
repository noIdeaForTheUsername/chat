import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  login: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ nullable: true, type: "text" })
  email: string | null;

  @Column({ nullable: true, type: "varchar", name: 'phone_number' })
  phoneNumber: string | null;

  @Column({ default: false })
  activated: boolean;

  @Column({ default: false })
  admin: boolean;
}
