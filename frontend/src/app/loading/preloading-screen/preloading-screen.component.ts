import { Component, inject } from "@angular/core";
import { AppInitService } from "@src/app/loading/app-init.service";
import { LoadingIndicator } from "../loading-indicator-component/loading-indicator.component";

@Component({
  selector: 'app-preloading-screen',
  templateUrl: './preloading-screen.component.html',
  standalone: true,
  imports: [LoadingIndicator],
})
export class PreloadingScreenComponent {

  // NOTE: APP INIT SERVICE IS THE FILE THAT NAVIGATES THE USER FURTHER FROM THIS LOADING PAGE

  protected initService = inject(AppInitService);
  protected loadingError = this.initService.loadingError;
}