import { HttpClient } from "@angular/common/http";
import { map, Observable } from "rxjs";
import { UserProfile } from "@app/profiles/profile.interface";
import { mapUserProfile, ServerUserProfile } from "@app/profiles/profile-utils";

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

  getMe(): Observable<UserProfile> {
    return this.http.get<ServerUserProfile>('/auth/me').pipe(
      map(res => mapUserProfile(res))
    );
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

}


