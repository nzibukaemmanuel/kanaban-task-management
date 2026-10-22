import type { Environment } from './environment';

// Production build — swapped in for environment.ts by the `fileReplacements` entry in angular.json.
// There is no hosted backend for this lab, so the deployed app uses the in-memory mock API too;
// flip `useMockApi` and set `apiUrl` once a real API exists.
export const environment: Environment = {
  production: true,
  apiUrl: '/api',
  useMockApi: true,
  mockLatencyMs: 200,
};
