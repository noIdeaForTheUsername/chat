import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity("full_profiles")
export class FullProfile {
  @ViewColumn()
  id: number;

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
}