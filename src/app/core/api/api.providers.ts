import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, Provider } from '@angular/core';
import type { Environment } from '../../../environments/environment.model';
import { API_BASE_URL, MOCK_API_LATENCY_MS } from './api.config';
import { mockApiInterceptor } from './mock-api.interceptor';

// The one place the active environment decides where data comes from. With `useMockApi` the
// interceptor answers /api requests in memory; without it requests go over the network to
// `apiUrl`. Everything above HttpClient (services, effects, components) is identical either way.
export function provideApi(env: Pick<Environment, 'apiUrl' | 'useMockApi' | 'mockLatencyMs'>): (
  | Provider
  | EnvironmentProviders
)[] {
  return [
    { provide: API_BASE_URL, useValue: env.apiUrl },
    { provide: MOCK_API_LATENCY_MS, useValue: env.mockLatencyMs },
    provideHttpClient(withInterceptors(env.useMockApi ? [mockApiInterceptor] : [])),
  ];
}
