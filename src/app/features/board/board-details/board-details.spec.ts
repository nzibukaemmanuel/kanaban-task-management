import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { BoardDetails } from './board-details';
import { TaskActions } from '../store/task.actions';
import { provideTaskStoreForTests } from '../store/testing';

describe('BoardDetails', () => {
  let component: BoardDetails;
  let fixture: ComponentFixture<BoardDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardDetails],
      providers: [provideRouter([]), provideTaskStoreForTests()],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('navigates back to /boards', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.goBack();

    expect(navigateSpy).toHaveBeenCalledWith(['/boards']);
  });

  it("lists all of a board's tasks sorted by title by default", () => {
    fixture.componentRef.setInput('boardId', 'platform-launch');

    expect(component.tasks().map((t) => t.title)).toEqual([
      'Define MVP scope',
      'Design review',
      'Prepare press kit',
      'QA sign-off',
      'Run beta testing',
      'Write launch docs',
    ]);
  });

  it('filters tasks by the status query param', () => {
    fixture.componentRef.setInput('boardId', 'platform-launch');
    fixture.componentRef.setInput('status', 'todo');

    expect(component.tasks().map((t) => t.id)).toEqual(['press-kit', 'qa-signoff', 'write-docs']);
  });

  it('sorts tasks by status when the sort query param is "status"', () => {
    fixture.componentRef.setInput('boardId', 'platform-launch');
    fixture.componentRef.setInput('sort', 'status');

    expect(component.tasks().map((t) => t.status)).toEqual([
      'doing',
      'doing',
      'done',
      'todo',
      'todo',
      'todo',
    ]);
  });

  it('falls back to defaults when the router clears status/sort inputs to undefined (e.g. after a child-route nav that drops query params)', () => {
    fixture.componentRef.setInput('boardId', 'platform-launch');
    fixture.componentRef.setInput('status', undefined);
    fixture.componentRef.setInput('sort', undefined);

    expect(component.tasks().map((t) => t.title)).toEqual([
      'Define MVP scope',
      'Design review',
      'Prepare press kit',
      'QA sign-off',
      'Run beta testing',
      'Write launch docs',
    ]);
  });

  it('returns no tasks for an unknown board', () => {
    fixture.componentRef.setInput('boardId', 'does-not-exist');

    expect(component.tasks()).toEqual([]);
  });

  it('flags an unknown board id as not existing', () => {
    fixture.componentRef.setInput('boardId', 'does-not-exist');

    expect(component.boardExists()).toBe(false);
  });

  it('flags a real board id as existing', () => {
    fixture.componentRef.setInput('boardId', 'platform-launch');

    expect(component.boardExists()).toBe(true);
  });

  it('reflects an update dispatched through the store without needing a reload', () => {
    fixture.componentRef.setInput('boardId', 'platform-launch');
    const store = TestBed.inject(Store);

    store.dispatch(
      TaskActions.updateTask({
        boardId: 'platform-launch',
        taskId: 'write-docs',
        changes: { title: 'Write launch docs (v2)' },
      }),
    );

    expect(component.tasks().map((t) => t.title)).toContain('Write launch docs (v2)');
  });

  it('is unaffected by an edit made to a task on a different board', () => {
    fixture.componentRef.setInput('boardId', 'platform-launch');
    const store = TestBed.inject(Store);
    const before = component.tasks();

    store.dispatch(
      TaskActions.updateTask({
        boardId: 'roadmap',
        taskId: 'q1-goals',
        changes: { title: 'Renamed elsewhere' },
      }),
    );

    expect(component.tasks()).toEqual(before);
  });

  it('merges new query params onto the current route when filtering/sorting', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const route = TestBed.inject(ActivatedRoute);

    component.updateQueryParams({ status: 'done' });

    expect(navigateSpy).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: { status: 'done' },
      queryParamsHandling: 'merge',
    });
  });
});
