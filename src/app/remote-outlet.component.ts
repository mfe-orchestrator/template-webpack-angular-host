import {
  Component,
  OnInit,
  ViewContainerRef,
  inject,
  input,
  signal,
  type Type,
} from '@angular/core';

/**
 * Instantiates a component that lives in a remote microfrontend.
 *
 * The loader is a plain `() => import('someremote/Something')`: Module Federation
 * turns that into a request to the URL the orchestrator resolved, so this
 * component never sees a URL or a version.
 */
@Component({
  selector: 'app-remote-outlet',
  standalone: true,
  template: `
    @if (state() === 'loading') {
      <span>Loading remote…</span>
    }
    @if (state() === 'error') {
      <span class="remote-error">{{ message() }}</span>
    }
  `,
  styles: [
    `
      .remote-error {
        color: #b4530a;
      }
    `,
  ],
})
export class RemoteOutletComponent implements OnInit {
  /** Returns the module of the remote. The default export, or the first exported component, is created. */
  readonly loader = input.required<() => Promise<Record<string, unknown>>>();

  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  readonly message = signal('');

  private readonly viewContainer = inject(ViewContainerRef);

  async ngOnInit(): Promise<void> {
    try {
      const module = await this.loader()();
      const component = (module['default'] ??
        Object.values(module).find(value => typeof value === 'function')) as
        | Type<unknown>
        | undefined;

      if (!component) {
        throw new Error('the remote module exports no component');
      }

      this.viewContainer.createComponent(component);
      this.state.set('ready');
    } catch (error) {
      this.message.set(
        `Remote not available (${(error as Error).message}). Point webpack.config.js at one of your own slugs.`
      );
      this.state.set('error');
    }
  }
}
