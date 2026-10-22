import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AddTask } from './add-task';
import { NotificationService } from '../../../core/notification.service';
import { TaskService } from '../task.service';
import { provideTaskStoreForTests } from '../store/testing';

describe('AddTask', () => {
  let fixture: ComponentFixture<AddTask>;
  let component: AddTask;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddTask],
      providers: [provideRouter([]), provideTaskStoreForTests()],
    }).compileComponents();

    fixture = TestBed.createComponent(AddTask);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('boardId', 'roadmap');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('has no unsaved changes until the form is edited', () => {
    expect(component.hasUnsavedChanges()).toBe(false);
  });

  it('adds the task to the board and navigates back to it on save', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const taskService = TestBed.inject(TaskService);

    component.onSave({
      title: 'New task',
      description: 'Some details.',
      status: 'todo',
      dueDate: '2026-09-01',
      subtasks: [],
    });

    expect(taskService.getTasks('roadmap').some((task) => task.title === 'New task')).toBe(true);
    expect(navigateSpy).toHaveBeenCalledWith(['/boards', 'roadmap']);
  });

  it('shows a success notice after saving', () => {
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const notificationService = TestBed.inject(NotificationService);

    component.onSave({
      title: 'New task',
      description: 'Some details.',
      status: 'todo',
      dueDate: '2026-09-01',
      subtasks: [],
    });

    expect(notificationService.notice()).toEqual({
      message: '"New task" was added.',
      kind: 'success',
    });
  });

  it('navigates back to the board on cancel', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.onCancel();

    expect(navigateSpy).toHaveBeenCalledWith(['/boards', 'roadmap']);
  });
});
