import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, type: "varchar", name: 'phone_number' })
  phoneNumber: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ default: false })
  activated: boolean;

  @Column({ default: false })
  admin: boolean;
}
