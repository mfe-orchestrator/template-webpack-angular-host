import { Component } from '@angular/core';
import { ManifestPanelComponent } from './manifest-panel.component';
import { RemoteOutletComponent } from './remote-outlet.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ManifestPanelComponent, RemoteOutletComponent],
  template: `
    <h1>Module Federation host</h1>
    <p>Webpack + Angular + MFE Orchestrator</p>
    <p>
      This host resolves its remotes through the orchestrator: it never knows, and
      never chooses, which version it is served.
    </p>

    <!--
      Example remote, declared in webpack.config.js. Rename "exampleremote" and the
      slug it points to, or delete both once you wire your own microfrontends.
    -->
    <app-remote-outlet [loader]="loadExampleButton" />

    <app-manifest-panel />
  `,
  styles: [
    `
      :host {
        display: block;
        font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
        max-width: 960px;
        margin: 0 auto;
        padding: 2rem;
      }
    `,
  ],
})
export class AppComponent {
  readonly loadExampleButton = () => import('exampleremote/Button');
}
