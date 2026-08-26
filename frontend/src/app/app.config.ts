import { ApplicationConfig, importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { LucideAngularModule, Activity, CheckCircle, ChevronDown, Clock, Landmark, LoaderCircle, Menu, Shield, XCircle, Zap } from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
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
