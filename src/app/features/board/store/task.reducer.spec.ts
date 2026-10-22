import { taskAdapter, TaskState, taskReducer } from './task.reducer';
import { TaskActions } from './task.actions';
import { TaskEntity } from './task.model';

const task: TaskEntity = {
  id: 'new-task',
  boardId: 'roadmap',
  title: 'New task',
  description: '',
  status: 'todo',
  dueDate: '',
  subtasks: [],
};

describe('taskReducer', () => {
  it('is seeded with every fixture task on startup', () => {
    const state = taskReducer(undefined, { type: '@@INIT' });

    expect(state.loaded).toBe(true);
    expect(state.ids).toContain('q1-goals');
    expect(state.entities['q1-goals']?.boardId).toBe('roadmap');
  });

  it('replaces all entities on Load Tasks Success and marks the state loaded', () => {
    const empty: TaskState = taskAdapter.getInitialState({
      loaded: false,
      loading: true,
      error: null,
    });

    const state = taskReducer(empty, TaskActions.loadTasksSuccess({ tasks: [task] }));

    expect(state.loaded).toBe(true);
    expect(state.loading).toBe(false);
    expect(state.ids).toEqual(['new-task']);
  });

  it('records the error and stops loading on Load Tasks Failure', () => {
    const loading: TaskState = taskAdapter.getInitialState({
      loaded: false,
      loading: true,
      error: null,
    });

    const state = taskReducer(loading, TaskActions.loadTasksFailure({ error: 'boom' }));

    expect(state.loading).toBe(false);
    expect(state.error).toBe('boom');
  });

  it('adds a new entity on Add Task Success', () => {
    const before = taskReducer(undefined, { type: '@@INIT' });

    const state = taskReducer(before, TaskActions.addTaskSuccess({ task }));

    expect(state.entities['new-task']).toEqual(task);
  });

  it('merges changes onto the existing entity on Update Task Success', () => {
    const before = taskReducer(undefined, { type: '@@INIT' });

    const state = taskReducer(
      before,
      TaskActions.updateTaskSuccess({ update: { id: 'q1-goals', changes: { status: 'done' } } }),
    );

    expect(state.entities['q1-goals']?.status).toBe('done');
    expect(state.entities['q1-goals']?.title).toBe('Set Q1 goals');
  });

  it('removes the entity on Delete Task Success', () => {
    const before = taskReducer(undefined, { type: '@@INIT' });

    const state = taskReducer(before, TaskActions.deleteTaskSuccess({ taskId: 'q1-goals' }));

    expect(state.entities['q1-goals']).toBeUndefined();
  });
});
