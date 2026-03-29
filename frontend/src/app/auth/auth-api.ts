import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { UserAccount } from "./account.interface";

export interface RegisterBody {
	name: string;
  phoneNumber: string;
	password: string;
	passwordRepeat: string;
	bio: string | null;
}

export class AuthBackendApi {

  private http: HttpClient;

  constructor (http: HttpClient) {
    this.http = http;
  }

  getAccount(): Observable<UserAccount> {
    return this.http.get<UserAccount>('/auth/me');
  }

  login(body: { phoneNumber: string; password: string }): Observable<null> {
    return this.http.post<null>('/auth/login', body);
  }

  register(body: RegisterBody): Observable<null> {
    return this.http.post<null>('/auth/register', body);
  }

  logout(): Observable<null> {
    return this.http.post<null>('/auth/logout', {});
  }

  globalLogout(): Observable<null> {
    return this.http.post<null>('/auth/global-logout', {});
  }

  editAccount(updatedFieldsObject: Partial<UserAccount>) {
    return this.http.patch<UserAccount>("/accounts/me", updatedFieldsObject);
  }
}


