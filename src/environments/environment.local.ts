import type { Environment } from './environment.model';

// `npm run start:local` — talks to the json-server REST API from `npm run api` (server/db.json)
// instead of the in-browser mock, so the app makes real HTTP requests to a real process. Start
// the API first; json-server answers CORS requests for any origin.
export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  useMockApi: false,
  mockLatencyMs: 0,
};
