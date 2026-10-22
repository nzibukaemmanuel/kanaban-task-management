import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, Provider } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { MOCK_API_LATENCY_MS } from '../../../core/api/api.config';
import { mockApiInterceptor } from '../../../core/api/mock-api.interceptor';
import { BOARD_TASKS } from '../board-data';
import { taskAdapter, taskReducer, TaskState } from './task.reducer';
import { TaskEffects } from './task.effects';
import { TASK_FEATURE_KEY } from './task.selectors';

// The fixture data as a fully loaded store slice — what the store holds once the first
// Load Tasks round-trip has finished against the mock API.
export function seededTaskState(): TaskState {
  const tasks = Object.entries(BOARD_TASKS).flatMap(([boardId, boardTasks]) =>
    boardTasks.map((task) => ({ ...task, boardId })),
  );
  return taskAdapter.setAll(
    structuredClone(tasks),
    taskAdapter.getInitialState({ loaded: true, loading: false, saving: false, error: null }),
  );
}

// Every spec whose component tree injects Store needs the same feature + effects registered
// that app.config.ts provides in the real app, plus HttpClient wired to the mock API with no
// artificial latency — this is the one place that wiring is defined, so specs stay in sync with
// app.config.ts instead of quietly drifting apart. The store starts already loaded (see
// seededTaskState) unless a spec asks for the real empty initial state.
export function provideTaskStoreForTests(options: { seeded?: boolean } = {}): (Provider | EnvironmentProviders)[] {
  const { seeded = true } = options;
  return [
    provideHttpClient(withInterceptors([mockApiInterceptor])),
    { provide: MOCK_API_LATENCY_MS, useValue: 0 },
    provideStore(
      { [TASK_FEATURE_KEY]: taskReducer },
      seeded ? { initialState: { [TASK_FEATURE_KEY]: seededTaskState() } } : {},
    ),
    provideEffects(TaskEffects),
  ];
}
