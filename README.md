# Webpack & Angular — host template

Starter template for the [MFE Orchestrator](https://github.com/mfe-orchestrator), listed in the
marketplace as `webpack-host-angular`. Webpack 5 + Angular 21, wired as a **host**.

## Requirements

- Node.js 20 or newer
- [pnpm](https://pnpm.io) 10 or newer

> [!NOTE]
> The client SDK is published as `@mfe-orchestrator-hub/client` and this template depends on it at
> `^0.1.0`. A caret on a `0.x` version is deliberately narrow: it accepts `0.1.x`
> only, **not** `0.2.0`. The SDK is new and parts of its API are still settling, so that is the
> intended level of caution — the cost is that you have to widen this range yourself when the SDK
> moves to `0.2.0`, otherwise `pnpm install` fails to resolve it.

## Getting started

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # production build into dist/
```

## Project structure

```
.
├── .github/workflows/build-and-deploy.yml   # build + upload + Docker image
├── Dockerfile                               # standalone nginx deploy
├── nginx/no-cache.conf
├── public/index.html
├── src/
│   ├── app/
│   │   ├── app.component.ts                 # shell
│   │   ├── manifest-panel.component.ts      # reads the manifest through the SDK
│   │   └── remote-outlet.component.ts       # instantiates a component from a remote
│   ├── bootstrap.ts
│   ├── globals.d.ts                         # env + remote module declarations
│   └── index.ts                             # configure() lives here
├── .env.example
├── package.json
├── tsconfig.json
└── webpack.config.js                        # federation config
```

## How the orchestrator is wired in

**The host never decides which version it gets.** It hands over the identities it holds and uses
the URL it receives, verbatim. Which version that URL points at — stable, canary, whatever — is
decided by the backend. Nothing in this repo parses a version, builds a URL by hand, or knows that
canaries exist.

Two pieces make that work.

**1. `configure()`, at the very top of the entry point (`src/index.ts`), synchronously, before
anything imports a remote:**

```ts
import { configure } from '@mfe-orchestrator-hub/client';

// MFE_ENV is injected by DefinePlugin, see webpack.config.js
configure(MFE_ENV);
```

`MFE_ENV` carries `backendUrl` and `projectId`, and an `environment` only if you set one — see
[The environment is optional](#the-environment-is-optional).

**2. The remote, declared in `webpack.config.js` as a promise that resolves to a URL:**

```js
new ModuleFederationPlugin({
  name: 'host',
  filename: 'remoteEntry.js',
  exposes: { './App': './src/...' },
  remotes: {
    exampleremote: `promise import('@mfe-orchestrator-hub/client').then(m => m.remoteUrl('example-remote'))`,
  },
  shared: { ... },
})
```

`remoteUrl('example-remote')` takes the **slug** of a microfrontend and returns the URL the backend
resolved for it, already pinned to a version. Rename the key and the slug to match your own
microfrontends, and add one entry per remote.

The SDK also exposes `manifest()`, `globalVariables()` and `identities()`, all used in this
template, so you can see what the environment actually returned.

## Environment variables

Read from the shell at build time and injected by webpack's `DefinePlugin`. See `.env.example`.

| variable | what it is |
| --- | --- |
| `MFE_BACKEND_URL` | orchestrator backend, including the `/api` suffix |
| `MFE_PROJECT_ID` | id of your project in the orchestrator |
| `MFE_ENVIRONMENT` | **optional** — orchestrator environment slug, ex. `DEV`. See below |

```bash
MFE_PROJECT_ID=abc123 pnpm build                      # environment resolved by domain
MFE_PROJECT_ID=abc123 MFE_ENVIRONMENT=DEV pnpm build  # environment pinned at build time
```

### The environment is optional

`MFE_ENVIRONMENT` is the slug of an **orchestrator** environment. It has nothing to do with
Angular's own `src/environments/*` configuration files — this template has none of those, and the
two must not be confused.

Leave `MFE_ENVIRONMENT` unset and the SDK omits the environment: the backend then resolves it from
the domain the page is served on, matching it against the domains declared for each environment in
the console. One build artifact can therefore be promoted across DEV, STAGE and PROD unchanged.

Set it when the host already knows where it runs, or when a single domain serves more than one
environment and the backend cannot tell them apart.

`webpack.config.js` only adds the `environment` key to the injected `MFE_ENV` object when the
variable is actually set, so `configure()` never receives an empty string or the string
`"undefined"` — either of which the SDK would take for a real slug.

`.env` is gitignored. Never commit real values.

## Build output

`pnpm build` writes to `dist/`. The federation entry lands at **`dist/remoteEntry.js`**.

The marketplace entry for this template declares no `entryPoint`; the whole `dist/` folder is what gets uploaded.

Check it after any change to `webpack.config.js`: the orchestrator serves exactly that path, so a build that
puts the entry somewhere else is broken.

## Deploying

### Upload to the orchestrator

`.github/workflows/build-and-deploy.yml` builds the app and uploads `dist/` with
[`mfe-orchestrator/github-action`](https://github.com/mfe-orchestrator/github-action). It runs on
any pushed tag, or manually via *Run workflow*.

Configure these once, in the repository settings:

| kind | name | value |
| --- | --- | --- |
| secret | `MICROFRONTEND_ORCHESTRATOR_API_KEY` | your orchestrator API key |
| variable | `MICROFRONTEND_SLUG` | the slug of this host in the orchestrator |
| variable | `ORCHESTRATOR_DOMAIN` | your console URL, optional, defaults to `https://console.mfe-orchestrator.dev` |

The API key is a **secret**, never a variable and never a literal in the workflow file. If you
prefer hardcoding the two per project values instead of using repository variables, replace the
expressions in the `env:` block at the top of the workflow.

### Standalone deploy

A host is consumable as a remote, but it is also an application in its own right, so the same
workflow builds and pushes an nginx image to `ghcr.io/<owner>/<repo>`. `nginx/no-cache.conf` serves
`index.html` for any route and marks the entry files as never cacheable, so a redeploy is picked up
immediately.

```bash
docker build -t my-host .
docker run -p 8080:80 my-host
```

## Notes

- Angular is compiled ahead of time by `AngularWebpackPlugin` from `@ngtools/webpack` — the same compiler the Angular CLI drives, wired into a plain webpack config. There is no `angular.json` and no CLI builder here.
- `configure()` runs in `src/index.ts`, before the `import('./bootstrap')` that starts the app. Keep that order: the federation runtime imports the SDK to resolve a remote and expects it already configured.
- Remote modules are invisible to the compiler. Declare each one you import in `src/globals.d.ts`.
- `output.publicPath` stays `'auto'`. A classic script derives the base of its chunks from `document.currentScript.src`, which is the URL *before* any redirect, so this is what keeps a version pinned entry loading its own chunks instead of mixing two builds in one page.

## License

MIT
