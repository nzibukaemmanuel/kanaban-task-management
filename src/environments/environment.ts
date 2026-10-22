// Development build. `useMockApi` swaps the real network for the in-memory backend in
// core/api/mock-api.interceptor.ts, so the app is fully usable without running a server.
// To point at a real backend instead, set `useMockApi: false` and `apiUrl` to its base URL.
export const environment = {
  production: false,
  apiUrl: '/api',
  useMockApi: true,
  // Simulated network round-trip, long enough for loading indicators to be visible while developing.
  mockLatencyMs: 500,
};

export type Environment = typeof environment;
