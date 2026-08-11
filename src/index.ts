// configure() must run at the very top of the entry point, synchronously, before
// anything imports a remote. It is idempotent.
import { configure } from '@mfe-orchestrator-hub/client';

// MFE_ENV carries no `environment` key when MFE_ENVIRONMENT was unset at build time, so the SDK
// receives a real `undefined` and lets the backend resolve the environment from the domain.
configure(MFE_ENV);

// The dynamic import keeps the rest of the app out of the entry chunk, so Module
// Federation can negotiate the shared scope before the app boots.
import('./bootstrap');

export {};
