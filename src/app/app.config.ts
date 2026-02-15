import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideIcons } from '@ng-icons/core';
import {
  heroPencil,
  heroTrash,
  heroPlus,
  heroUser,
  heroArrowPath,
  heroXMark,
  heroCheck,
} from '@ng-icons/heroicons/outline';

import { routes } from './app.routes';
import { authInterceptor } from './auth/auth.interceptor';
import { errorInterceptor } from './auth/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideIcons({
      heroPencil,
      heroTrash,
      heroPlus,
      heroUser,
      heroArrowPath,
      heroXMark,
      heroCheck,
    }),
  ],
};
