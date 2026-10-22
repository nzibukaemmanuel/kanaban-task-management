// Shape every environment file must satisfy, kept in its own file because angular.json swaps
// environment.ts for environment.prod.ts at build time — a type exported from either would
// vanish from the other build.
export interface Environment {
  production: boolean;
  // Base URL every data service prefixes its endpoints with.
  apiUrl: string;
  // true → answer requests from the in-memory mock API instead of the network.
  useMockApi: boolean;
  // Simulated network round-trip for the mock API, in milliseconds.
  mockLatencyMs: number;
}
