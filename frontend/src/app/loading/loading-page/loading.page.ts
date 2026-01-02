import { Component, inject, OnInit } from "@angular/core";
import { StandardHeaderComponent } from "@app/shared/headers/standard-header-component/standard-header.component";
import { TranslatePipe } from "@ngx-translate/core";
import { IonContent } from "@ionic/angular/standalone";
import { LoadingIndicator } from "../loading-indicator-component/loading-indicator.component";
import { AuthService } from "@app/auth/auth.service";
import { Router } from "@angular/router";

@Component({
  selector: 'app-loading-page',
  templateUrl: './loading.page.html',
  standalone: true,
  imports: [StandardHeaderComponent, TranslatePipe, IonContent, LoadingIndicator],
})
export class LoadingPage implements OnInit {

  private authService = inject(AuthService);

  // ON APP START
  ngOnInit() {
    this.authService.loadAuth();
  }
}