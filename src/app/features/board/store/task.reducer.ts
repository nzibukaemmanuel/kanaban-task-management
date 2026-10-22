import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { BOARD_TASKS } from '../board-data';
import { TaskActions } from './task.actions';
import { TaskEntity } from './task.model';

export interface TaskState extends EntityState<TaskEntity> {
  loaded: boolean;
  loading: boolean;
  error: string | null;
}

export const taskAdapter = createEntityAdapter<TaskEntity>();

// Seeded straight from the same fixture TaskService boots from, so the store already has data
// on first render instead of showing an empty board until a "Load Tasks" round-trip completes —
// there's no real backend behind this app yet, so an empty-until-loaded state would just be a
// flash of nothing rather than an honest loading state. `Load Tasks` still exists (dispatched
// from AppComponent, see app.ts) to demonstrate the load → effect → reducer flow and to
// re-sync the store from TaskService after something outside the store's own action stream
// changes it.
const seedTasks: TaskEntity[] = Object.entries(BOARD_TASKS).flatMap(([boardId, tasks]) =>
  tasks.map((task) => ({ ...task, boardId })),
);

export const initialTaskState: TaskState = taskAdapter.setAll(
  seedTasks,
  taskAdapter.getInitialState({ loaded: true, loading: false, error: null }),
);

export const taskReducer = createReducer(
  initialTaskState,
  on(TaskActions.loadTasks, (state) => ({ ...state, loading: true, error: null })),
  on(TaskActions.loadTasksSuccess, (state, { tasks }) =>
    taskAdapter.setAll(tasks, { ...state, loading: false, loaded: true }),
  ),
  on(TaskActions.loadTasksFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(TaskActions.addTaskSuccess, (state, { task }) =>
    taskAdapter.addOne(task, { ...state, error: null }),
  ),
  on(TaskActions.updateTaskSuccess, (state, { update }) =>
    taskAdapter.updateOne(update, { ...state, error: null }),
  ),
  on(TaskActions.deleteTaskSuccess, (state, { taskId }) =>
    taskAdapter.removeOne(taskId, { ...state, error: null }),
  ),

  on(
    TaskActions.addTaskFailure,
    TaskActions.updateTaskFailure,
    TaskActions.deleteTaskFailure,
    (state, { error }) => ({
      ...state,
      error,
    }),
  ),
);
