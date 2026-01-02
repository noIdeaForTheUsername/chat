import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { provideZoneChangeDetection } from "@angular/core";
import { provideTranslateService } from "@ngx-translate/core";

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { urlInterceptor } from '@app/common/http/url.interceptor';
import { credentialsInterceptor } from '@app/common/http/credentials.interceptor';
import { loggingInterceptor } from '@app/common/http/logging.interceptor';
import { connectionErrorInterceptor } from '@app/common/http/connection-error.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([urlInterceptor, credentialsInterceptor, loggingInterceptor, connectionErrorInterceptor])),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideTranslateService({
      fallbackLang: 'en',
      lang: 'en'
    })
  ],
});
