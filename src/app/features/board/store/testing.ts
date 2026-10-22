import { EnvironmentProviders, Provider } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { taskReducer } from './task.reducer';
import { TaskEffects } from './task.effects';
import { TASK_FEATURE_KEY } from './task.selectors';

// Every spec whose component tree injects Store needs the same feature + effects registered
// that app.config.ts provides in the real app — this is the one place that wiring is defined,
// so specs stay in sync with app.config.ts instead of quietly drifting apart.
export function provideTaskStoreForTests(): (Provider | EnvironmentProviders)[] {
  return [provideStore({ [TASK_FEATURE_KEY]: taskReducer }), provideEffects(TaskEffects)];
}
