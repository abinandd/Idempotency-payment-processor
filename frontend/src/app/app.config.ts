import { ApplicationConfig, importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { LucideAngularModule, Activity, CheckCircle, ChevronDown, Clock, Landmark, LoaderCircle, Menu, Shield, XCircle, Zap } from 'lucide-angular';
import { mockApiInterceptor } from './mock-api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(withInterceptors([mockApiInterceptor])),
    importProvidersFrom(
      LucideAngularModule.pick({
        Activity,
        CheckCircle,
        ChevronDown,
        Clock,
        Landmark,
        LoaderCircle,
        Menu,
        Shield,
        XCircle,
        Zap,
      })
    )
  ]
};
