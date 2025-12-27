import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity("user_known_profiles")
export class UserContact {
  @ViewColumn({ name: "contact_owner_id" })
  contactOwnerId: number;

  @ViewColumn()
  id: number;  // profile/account id

  @ViewColumn()
  login: string;

  @ViewColumn()
  name: string;

  @ViewColumn()
  bio: string;

  @ViewColumn()
  email?: string;

  @ViewColumn({ name: "phone_number" })
  phoneNumber?: string;

  @ViewColumn()
  nick?: string;

  @ViewColumn()
  blocked: boolean;
}