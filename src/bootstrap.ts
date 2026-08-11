import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

// Zoneless change detection, so no zone.js polyfill has to be loaded here. If you
// prefer the zone based scheduler, drop the provider and add `import 'zone.js'`
// at the top of this file instead.
bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection()],
}).catch(err => console.error(err));
