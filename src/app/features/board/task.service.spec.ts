import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { TaskService } from './task.service';

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskService);
  });

  it('returns the seeded tasks for a known board', () => {
    expect(service.getTasks('roadmap').map((task) => task.id)).toEqual([
      'q1-goals',
      'prioritize-features',
      'q2-goals',
      'review-roadmap-risks',
    ]);
  });

  it('returns an empty array for an unknown board', () => {
    expect(service.getTasks('does-not-exist')).toEqual([]);
  });

  it('finds a single task by board and id', () => {
    expect(service.getTask('roadmap', 'q1-goals')?.title).toBe('Set Q1 goals');
  });

  it('returns undefined for a task id that does not exist on that board', () => {
    expect(service.getTask('roadmap', 'not-real')).toBeUndefined();
  });

  describe('otherTitles', () => {
    it('lists every title on the board when nothing is excluded', () => {
      expect(service.otherTitles('roadmap', null)).toEqual([
        'Set Q1 goals',
        'Prioritize features',
        'Set Q2 goals',
        'Review roadmap risks',
      ]);
    });

    it('excludes the given task id', () => {
      expect(service.otherTitles('roadmap', 'q1-goals')).toEqual([
        'Prioritize features',
        'Set Q2 goals',
        'Review roadmap risks',
      ]);
    });
  });

  describe('addTask', () => {
    it('appends a new task to the board with a generated id', () => {
      const added = service.addTask('roadmap', { title: 'New task', description: '', status: 'todo', dueDate: '', subtasks: [] });

      expect(added.id).toBeTruthy();
      expect(service.getTasks('roadmap').map((task) => task.id)).toContain(added.id);
    });

    it('does not affect tasks on other boards', () => {
      const before = service.getTasks('platform-launch');

      service.addTask('roadmap', { title: 'New task', description: '', status: 'todo', dueDate: '', subtasks: [] });

      expect(service.getTasks('platform-launch')).toEqual(before);
    });

    it('generates distinct ids for two tasks with the same title', () => {
      const first = service.addTask('roadmap', { title: 'Duplicate', description: '', status: 'todo', dueDate: '', subtasks: [] });
      const second = service.addTask('roadmap', { title: 'Duplicate', description: '', status: 'todo', dueDate: '', subtasks: [] });

      expect(first.id).not.toBe(second.id);
    });
  });

  describe('the BehaviorSubject-backed Observable API', () => {
    it('getTasks$ emits the current tasks for a board to a new subscriber', async () => {
      const tasks = await firstValueFrom(service.getTasks$('roadmap'));
      expect(tasks.map((task) => task.id)).toEqual([
        'q1-goals',
        'prioritize-features',
        'q2-goals',
        'review-roadmap-risks',
      ]);
    });

    it('getTask$ emits a single task by board and id', async () => {
      const task = await firstValueFrom(service.getTask$('roadmap', 'q1-goals'));
      expect(task?.title).toBe('Set Q1 goals');
    });

    it('streams a new value on getTasks$ after addTask, without re-subscribing', async () => {
      const emissions: number[] = [];
      const subscription = service.getTasks$('roadmap').subscribe((tasks) => emissions.push(tasks.length));

      service.addTask('roadmap', { title: 'New task', description: '', status: 'todo', dueDate: '', subtasks: [] });
      subscription.unsubscribe();

      expect(emissions).toEqual([4, 5]);
    });

    it('boardTasks$ and the synchronous getters stay consistent — same BehaviorSubject, two ways to read it', async () => {
      const viaObservable = await firstValueFrom(service.boardTasks$);
      expect(viaObservable['roadmap']).toEqual(service.getTasks('roadmap'));
    });
  });

  describe('updateTask', () => {
    it('applies only the given changes, leaving other fields on the same task untouched', () => {
      service.updateTask('roadmap', 'q1-goals', { status: 'done' });

      const updated = service.getTask('roadmap', 'q1-goals');
      expect(updated?.status).toBe('done');
      expect(updated?.title).toBe('Set Q1 goals');
    });

    it('does not affect other tasks on the same board', () => {
      const otherBefore = service.getTask('roadmap', 'prioritize-features');

      service.updateTask('roadmap', 'q1-goals', { title: 'Renamed', status: 'done' });

      expect(service.getTask('roadmap', 'prioritize-features')).toEqual(otherBefore);
    });

    it('does not affect tasks on other boards', () => {
      const otherBoardBefore = service.getTasks('platform-launch');

      service.updateTask('roadmap', 'q1-goals', { title: 'Renamed' });

      expect(service.getTasks('platform-launch')).toEqual(otherBoardBefore);
    });

    it('is a no-op when the task id does not exist on that board', () => {
      const before = service.getTasks('roadmap');

      service.updateTask('roadmap', 'not-real', { title: 'Ghost' });

      expect(service.getTasks('roadmap')).toEqual(before);
    });
  });
});
