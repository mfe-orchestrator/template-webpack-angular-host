/** Injected by webpack's DefinePlugin at build time. See webpack.config.js. */
declare const MFE_ENV: {
  backendUrl: string;
  projectId: string;
  /**
   * Orchestrator environment slug, ex. "DEV". Optional: the key is absent from the injected object
   * when MFE_ENVIRONMENT is not set at build time, and the backend then resolves the environment
   * from the domain the page is served on.
   *
   * Not to be confused with Angular's own `src/environments/*` files: this template has none.
   */
  environment?: string;
};

/**
 * Remotes are resolved at runtime, so the compiler cannot see their types.
 * Add one line per remote module you import.
 */
declare module 'exampleremote/Button';
