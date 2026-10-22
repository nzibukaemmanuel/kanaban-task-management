import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { firstValueFrom, ReplaySubject } from 'rxjs';
import { TaskService } from '../task.service';
import { TaskActions } from './task.actions';
import { TaskEffects } from './task.effects';

// Exercises each effect directly against the real TaskService (an in-memory fixture, so calls
// resolve synchronously — no need to fake a clock or a network) — confirming the action → data
// layer call → result action leg of the flow that the component specs only cover indirectly.
describe('TaskEffects', () => {
  let actions$: ReplaySubject<unknown>;
  let effects: TaskEffects;
  let taskService: TaskService;

  beforeEach(() => {
    actions$ = new ReplaySubject(1);
    TestBed.configureTestingModule({
      providers: [TaskEffects, provideMockActions(() => actions$)],
    });
    effects = TestBed.inject(TaskEffects);
    taskService = TestBed.inject(TaskService);
  });

  it('loadTasks$ loads every seeded task from TaskService, tagged with its board id', async () => {
    actions$.next(TaskActions.loadTasks());

    const result = await firstValueFrom(effects.loadTasks$);

    expect(result.type).toBe(TaskActions.loadTasksSuccess.type);
    if (result.type === TaskActions.loadTasksSuccess.type) {
      expect(result.tasks.find((t) => t.id === 'q1-goals')).toEqual({
        ...taskService.getTask('roadmap', 'q1-goals'),
        boardId: 'roadmap',
      });
      expect(result.tasks.length).toBe(
        ['platform-launch', 'marketing-plan', 'roadmap'].reduce(
          (sum, boardId) => sum + taskService.getTasks(boardId).length,
          0,
        ),
      );
    }
  });

  it('addTask$ adds the task through TaskService and reports it back with its board id', async () => {
    actions$.next(
      TaskActions.addTask({
        boardId: 'roadmap',
        task: {
          title: 'Effect-added task',
          description: '',
          status: 'todo',
          dueDate: '',
          subtasks: [],
        },
      }),
    );

    const result = await firstValueFrom(effects.addTask$);

    expect(result.type).toBe(TaskActions.addTaskSuccess.type);
    if (result.type === TaskActions.addTaskSuccess.type) {
      expect(result.task.boardId).toBe('roadmap');
      expect(result.task.title).toBe('Effect-added task');
    }
    expect(taskService.getTasks('roadmap').some((t) => t.title === 'Effect-added task')).toBe(true);
  });

  it('updateTask$ updates the task through TaskService and reports an Update<TaskEntity>', async () => {
    actions$.next(
      TaskActions.updateTask({
        boardId: 'roadmap',
        taskId: 'q1-goals',
        changes: { status: 'done' },
      }),
    );

    const result = await firstValueFrom(effects.updateTask$);

    expect(result.type).toBe(TaskActions.updateTaskSuccess.type);
    if (result.type === TaskActions.updateTaskSuccess.type) {
      expect(result.update).toEqual({
        id: 'q1-goals',
        changes: { status: 'done', boardId: 'roadmap' },
      });
    }
    expect(taskService.getTask('roadmap', 'q1-goals')?.status).toBe('done');
  });

  it('deleteTask$ deletes the task through TaskService and reports its id', async () => {
    actions$.next(TaskActions.deleteTask({ boardId: 'roadmap', taskId: 'q1-goals' }));

    const result = await firstValueFrom(effects.deleteTask$);

    expect(result).toEqual(TaskActions.deleteTaskSuccess({ taskId: 'q1-goals' }));
    expect(taskService.getTask('roadmap', 'q1-goals')).toBeUndefined();
  });
});
