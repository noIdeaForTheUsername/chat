import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class ViewportService {

  private readonly defaultContent =
    'viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no';

  private readonly zoomableContent =
    'viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, user-scalable=yes';

  private get viewport(): HTMLMetaElement | null {
    return document.querySelector('meta[name="viewport"]');
  }

  enableZoom(): void {
    // this.viewport?.setAttribute('content', this.zoomableContent);
    // alert('Zoom enabled');
  }

  disableZoom(): void {
    // this.viewport?.setAttribute('content', this.defaultContent);
  }
}