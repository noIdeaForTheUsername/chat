import { HttpClient } from "@angular/common/http";
import { map, Observable } from "rxjs";
import { OwnProfile, ServerUserProfile, UserProfile } from "@app/profiles/profile.interface";
import { mapUserProfile } from "@app/profiles/profile-utils";
import { UserAccount } from "./account.interface";

export interface RegisterBody {
	name?: string | null;
	login: string;
	password: string;
	passwordRepeat: string;
	email?: string | null;
	phoneNumber?: string | null;
	bio?: string | null;
	emailPublic: boolean;
	phoneNumberPublic: boolean;
}

export class AuthBackendApi {

  private http: HttpClient;

  constructor (http: HttpClient) {
    this.http = http;
  }

  getAccount(): Observable<UserAccount> {
    return this.http.get<UserAccount>('/auth/me');
  }

  login(body: { account: string; password: string }): Observable<null> {
    return this.http.post<null>('/auth/login', body);
  }

  register(body: RegisterBody): Observable<null> {
    return this.http.post<null>('/auth/register', body);
  }

  logout(): Observable<null> {
    return this.http.post<null>('/auth/logout', {});
  }

  editAccount(updatedFieldsObject: Partial<UserAccount>) {
    return this.http.patch<UserAccount>("/accounts/me", updatedFieldsObject);
  }
}


