/** Injected by webpack's DefinePlugin at build time. See webpack.config.js. */
declare const MFE_ENV: {
  backendUrl: string;
  projectId: string;
  environment: string;
};

/**
 * Remotes are resolved at runtime, so the compiler cannot see their types.
 * Add one line per remote module you import.
 */
declare module 'exampleremote/Button';
