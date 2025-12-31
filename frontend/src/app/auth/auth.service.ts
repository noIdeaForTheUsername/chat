import { inject, Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { TranslateService } from "@ngx-translate/core";
import { AlertService } from "@app/alerts/alert-service/alert.service";
import { AlertType } from "@app/alerts/alert-type.enum";
import { UserProfile } from "@app/profiles/profile.interface";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private translate = inject(TranslateService);
  private alertService = inject(AlertService);
  private http = inject(HttpClient);

  private userId: number | null = 25;
  public readonly getUserId = () => this.userId;
  public readonly processing = signal(false);

  private getAuth() {
    this.http.get<Partial<UserProfile>>('/me').subscribe({
      next: (res) => {
        this.userId = res.id || null;
      },
      error: (e) => {
        if (e.status === 401)
          this.userId = null;
        else
          this.alertService.displayMessageAlert(AlertType.ERROR, this.translate.instant('error.0.description'),
            () => {}, this.translate.instant("error.0.header"));
      }
    });
  }
  

  login(body: { account: string; password: string }) {
    this.processing.set(true);
    this.http.post('/login', body).subscribe({
      next: (res: any) => {
        this.userId = res.id;
        this.processing.set(false);
      },
      error: (err) => {
        const msg = (err && err.error.message) ? err.error.message : 'common.form-invalid';
        this.alertService.displayMessageAlert(AlertType.ERROR, this.translate.instant(msg), () => {});
        this.processing.set(false);
      }
    });
  }

  register(body: {
    name?: string | null;
    login: string;
    password: string;
    passwordRepeat: string;
    email?: string | null;
    phoneNumber?: string | null;
    bio?: string | null;
    emailPublic: boolean;
    phoneNumberPublic: boolean;
  }) {
    this.processing.set(true);

    if (body.email?.length === 0)
      body.email = undefined;
    if (body.phoneNumber?.length === 0)
      body.phoneNumber = undefined;
    if (body.bio?.length === 0)
      body.bio = undefined;
    if (body.name?.length === 0)
      body.name = undefined;

    this.http.post('/register', body).subscribe({
      next: (res: any) => {
        this.processing.set(false);
        this.getAuth();
      },
      error: (err) => {
        this.processing.set(false);
        const msg = (err && err.error.message) ? err.error.message : 'common.form-invalid';
        this.alertService.displayMessageAlert(AlertType.ERROR, this.translate.instant(msg), () => {});
      }
    });
  }
}