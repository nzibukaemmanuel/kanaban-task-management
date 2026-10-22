import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { PreferencesService } from '../../../core/preferences.service';
import { TaskDetail } from './task-detail';
import { TaskService } from '../task.service';
import { TaskActions } from '../store/task.actions';
import { provideTaskStoreForTests } from '../store/testing';

describe('TaskDetail', () => {
  let component: TaskDetail;
  let fixture: ComponentFixture<TaskDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskDetail],
      providers: [provideRouter([]), provideTaskStoreForTests()],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('resolves the task matching boardId + taskId', () => {
    fixture.componentRef.setInput('boardId', 'roadmap');
    fixture.componentRef.setInput('taskId', 'q1-goals');

    expect(component.task()?.title).toBe('Set Q1 goals');
  });

  it('returns undefined when the task does not exist on that board', () => {
    fixture.componentRef.setInput('boardId', 'roadmap');
    fixture.componentRef.setInput('taskId', 'not-a-real-task');

    expect(component.task()).toBeUndefined();
  });

  it('reflects an update dispatched through the store without needing a reload', () => {
    fixture.componentRef.setInput('boardId', 'roadmap');
    fixture.componentRef.setInput('taskId', 'q1-goals');
    const store = TestBed.inject(Store);

    store.dispatch(
      TaskActions.updateTask({
        boardId: 'roadmap',
        taskId: 'q1-goals',
        changes: { status: 'done' },
      }),
    );

    expect(component.task()?.status).toBe('done');
  });

  it('navigates back to the parent board', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentRef.setInput('boardId', 'roadmap');

    component.goToBoard();

    expect(navigateSpy).toHaveBeenCalledWith(['/boards', 'roadmap']);
  });

  describe('deleteTask', () => {
    it('removes the task and navigates back to the board when confirmation is off', () => {
      TestBed.inject(PreferencesService).setConfirmBeforeDelete(false);
      const confirmSpy = vi.spyOn(window, 'confirm');
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      fixture.componentRef.setInput('boardId', 'roadmap');
      fixture.componentRef.setInput('taskId', 'q1-goals');

      component.deleteTask();

      expect(confirmSpy).not.toHaveBeenCalled();
      expect(TestBed.inject(TaskService).getTask('roadmap', 'q1-goals')).toBeUndefined();
      expect(navigateSpy).toHaveBeenCalledWith(['/boards', 'roadmap']);
    });

    it('does nothing when the user declines the confirmation prompt', () => {
      TestBed.inject(PreferencesService).setConfirmBeforeDelete(true);
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      fixture.componentRef.setInput('boardId', 'roadmap');
      fixture.componentRef.setInput('taskId', 'q1-goals');

      component.deleteTask();

      expect(TestBed.inject(TaskService).getTask('roadmap', 'q1-goals')).toBeDefined();
      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });
});
