import { Injectable } from "@angular/core";
import { environment } from "@src/environments/environment";
import { Capacitor } from "@capacitor/core";

@Injectable({
  providedIn: "root"
})
export class ApiUrlService {
  public readonly apiUrl: string;

  constructor() {
    if (Capacitor.isNativePlatform()) {
      this.apiUrl = environment.capacitorApiUrl.endsWith('/') ? environment.capacitorApiUrl.slice(0, -1) : environment.capacitorApiUrl;
    } else {
      this.apiUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;
    }
  }
}