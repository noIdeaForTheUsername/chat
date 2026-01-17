import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { inject, provideAppInitializer, provideZoneChangeDetection, isDevMode } from "@angular/core";
import { provideTranslateService } from "@ngx-translate/core";

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { urlInterceptor } from '@app/http/url.interceptor';
import { credentialsInterceptor } from '@app/http/credentials.interceptor';
import { loggingInterceptor } from '@app/http/logging.interceptor';
import { connectionErrorInterceptor } from '@app/http/connection-error.interceptor';
import { authInterceptor } from '@app/http/auth.interceptor';
import { AuthService } from './app/auth/auth.service';
import { provideServiceWorker } from '@angular/service-worker';
import { AppInitService } from './app/initialization/app-init.service';


bootstrapApplication(AppComponent, {

  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors(
      [urlInterceptor, credentialsInterceptor, connectionErrorInterceptor, authInterceptor]
    )),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideTranslateService({
      fallbackLang: 'en',
      lang: 'en'
    }),
    provideAppInitializer(() => {
      const initService = inject(AppInitService)
      initService.initializeApp();  // purposefully not waiting for completion - instead of blocking the application start, displaying loading pages or delayed error msgs
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
});
