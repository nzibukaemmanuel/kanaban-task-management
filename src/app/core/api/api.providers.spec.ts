import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment as development } from '../../../environments/environment';
import { environment as local } from '../../../environments/environment.local';
import { environment as production } from '../../../environments/environment.prod';
import { API_BASE_URL } from './api.config';
import { provideApi } from './api.providers';

describe('provideApi (environment switching)', () => {
  it('exposes the environment apiUrl through API_BASE_URL', () => {
    TestBed.configureTestingModule({
      providers: [provideApi({ apiUrl: 'https://api.example.com', useMockApi: false, mockLatencyMs: 0 })],
    });

    expect(TestBed.inject(API_BASE_URL)).toBe('https://api.example.com');
  });

  it('answers from the in-memory mock API, with no network request, when useMockApi is on', async () => {
    TestBed.configureTestingModule({
      providers: [provideApi({ apiUrl: '/api', useMockApi: true, mockLatencyMs: 0 })],
    });

    const boards = await firstValueFrom(TestBed.inject(HttpClient).get<{ id: string }[]>('/api/boards'));

    expect(boards.map((board) => board.id)).toContain('roadmap');
  });

  it('sends a real request to apiUrl when useMockApi is off', () => {
    TestBed.configureTestingModule({
      providers: [
        provideApi({ apiUrl: 'http://localhost:3000', useMockApi: false, mockLatencyMs: 0 }),
        provideHttpClientTesting(),
      ],
    });
    const httpMock = TestBed.inject(HttpTestingController);

    TestBed.inject(HttpClient).get('http://localhost:3000/boards').subscribe();

    const req = httpMock.expectOne('http://localhost:3000/boards');
    expect(req.request.method).toBe('GET');
    req.flush([]);
    httpMock.verify();
  });

  it('ships three distinct environment configurations', () => {
    expect(development).toMatchObject({ production: false, useMockApi: true, apiUrl: '/api' });
    expect(local).toMatchObject({
      production: false,
      useMockApi: false,
      apiUrl: 'http://localhost:3000',
    });
    expect(production).toMatchObject({ production: true, useMockApi: true, apiUrl: '/api' });
  });
});
