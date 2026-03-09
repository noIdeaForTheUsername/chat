import { bootstrapApplication } from '@angular/platform-browser';
import { PreloadAllModules, RouteReuseStrategy, provideRouter, withHashLocation, withPreloading } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { inject, isDevMode, provideAppInitializer, provideZoneChangeDetection } from "@angular/core";
import { provideTranslateService } from "@ngx-translate/core";

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { authInterceptor } from '@app/http/auth.interceptor';
import { connectionErrorInterceptor } from '@app/http/connection-error.interceptor';
import { credentialsInterceptor } from '@app/http/credentials.interceptor';
import { urlInterceptor } from '@app/http/url.interceptor';
import { Capacitor } from '@capacitor/core';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { AppInitService } from './app/loading/app-init.service';


bootstrapApplication(AppComponent, {

  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules), withHashLocation()),
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
      enabled: (!Capacitor.isNativePlatform()) && !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
});
