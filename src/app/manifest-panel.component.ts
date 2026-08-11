import { Component, OnInit, signal } from '@angular/core';
import {
  globalVariables,
  identities,
  manifest,
  type MicrofrontendEntry,
} from '@mfe-orchestrator/client';

@Component({
  selector: 'app-manifest-panel',
  standalone: true,
  template: `
    <section>
      <h2>Environment</h2>
      @if (error()) {
        <p class="remote-error">{{ error() }}</p>
      } @else {
        <ul>
          @for (mfe of microfrontends(); track mfe.slug) {
            <li>
              <strong>{{ mfe.name }}</strong> ({{ mfe.slug }}) — served version
              {{ mfe.version }}
            </li>
          }
        </ul>
        <ul>
          @for (entry of variables(); track entry[0]) {
            <li>{{ entry[0] }} = {{ entry[1] }}</li>
          }
        </ul>
      }
      <p class="ids">session {{ ids.sessionId }} · device {{ ids.deviceId }}</p>
    </section>
  `,
  styles: [
    `
      .remote-error {
        color: #b4530a;
      }

      .ids {
        color: #888;
        font-size: 0.8rem;
      }
    `,
  ],
})
export class ManifestPanelComponent implements OnInit {
  readonly microfrontends = signal<MicrofrontendEntry[]>([]);
  readonly variables = signal<Array<[string, string]>>([]);
  readonly error = signal('');
  readonly ids = identities();

  async ngOnInit(): Promise<void> {
    try {
      const [data, vars] = await Promise.all([manifest(), globalVariables()]);
      this.microfrontends.set(data.microfrontends ?? []);
      this.variables.set(Object.entries(vars));
    } catch (error) {
      this.error.set((error as Error).message);
    }
  }
}
