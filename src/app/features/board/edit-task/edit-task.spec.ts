import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { EditTask } from './edit-task';
import { NotificationService } from '../../../core/notification.service';
import { TaskService } from '../task.service';
import { provideTaskStoreForTests } from '../store/testing';

describe('EditTask', () => {
  let fixture: ComponentFixture<EditTask>;
  let component: EditTask;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTask],
      providers: [provideRouter([]), provideTaskStoreForTests()],
    }).compileComponents();

    fixture = TestBed.createComponent(EditTask);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('boardId', 'roadmap');
    fixture.componentRef.setInput('taskId', 'q1-goals');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('resolves the task being edited', () => {
    expect(component.task()?.title).toBe('Set Q1 goals');
  });

  it('updates the task and navigates back to its detail page on save', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const taskService = TestBed.inject(TaskService);

    component.onSave({
      title: 'Set Q1 goals (revised)',
      description: 'Revised scope after planning.',
      status: 'done',
      dueDate: '2026-09-20',
      subtasks: [],
    });

    expect(taskService.getTask('roadmap', 'q1-goals')?.title).toBe('Set Q1 goals (revised)');
    expect(navigateSpy).toHaveBeenCalledWith(['/boards', 'roadmap', 'tasks', 'q1-goals']);
  });

  it('shows a success notice after saving', () => {
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const notificationService = TestBed.inject(NotificationService);

    component.onSave({
      title: 'Set Q1 goals (revised)',
      description: 'Revised scope after planning.',
      status: 'done',
      dueDate: '2026-09-20',
      subtasks: [],
    });

    expect(notificationService.notice()).toEqual({
      message: '"Set Q1 goals (revised)" was updated.',
      kind: 'success',
    });
  });

  it('navigates back to the task detail page on cancel', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.onCancel();

    expect(navigateSpy).toHaveBeenCalledWith(['/boards', 'roadmap', 'tasks', 'q1-goals']);
  });

  describe('when the task id does not exist on the board', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('taskId', 'not-a-real-task');
      fixture.detectChanges();
    });

    it('shows a "not found" message with no task form', () => {
      expect(fixture.nativeElement.querySelector('.empty-state')?.textContent).toContain(
        'not found',
      );
      expect(fixture.nativeElement.querySelector('app-task-form')).toBeNull();
    });

    it('offers a way back to the board, straight there rather than via the (also missing) task detail page', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

      expect(navigateSpy).toHaveBeenCalledWith(['/boards', 'roadmap']);
    });
  });
});
