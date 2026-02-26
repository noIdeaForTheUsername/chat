import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity('user_known_profiles')
export class UserKnownProfile {
  @ViewColumn({ name: 'contact_owner_id' })
  contactOwnerId: number;

  @ViewColumn()
  id: number;

  @ViewColumn()
  name: string;

  @ViewColumn()
  bio: string;

  @ViewColumn({ name: 'phone_number' })
  phoneNumber: string;

  @ViewColumn()
  nick?: string;

  @ViewColumn()
  blocked: boolean;
}
