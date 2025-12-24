import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { provideZoneChangeDetection } from "@angular/core";
import { provideTranslateService } from "@ngx-translate/core";

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideTranslateService({
      fallbackLang: 'en',
      lang: 'en'
    })
  ],
});
