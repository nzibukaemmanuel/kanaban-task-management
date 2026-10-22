import { Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { BOARD_TASKS, Task } from './board-data';

let nextTaskSuffix = 0;

// BOARD_TASKS is the seed/fixture data (also relied on by specs); this service owns the live,
// writable copy so Add/Edit Task forms have somewhere to persist changes without mutating the
// shared const or breaking existing computed()-based reads.
//
// State lives in a BehaviorSubject so it can be streamed to any subscriber (see boardTasks$ /
// getTasks$ below, consumed via the async pipe in Boards). toSignal bridges that same stream
// into a signal for the rest of the app's computed()-based components, so both consumption
// styles read from the one BehaviorSubject — never two copies of the task data.
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly boardTasksSubject = new BehaviorSubject<Record<string, Task[]>>(structuredClone(BOARD_TASKS));

  readonly boardTasks$: Observable<Record<string, Task[]>> = this.boardTasksSubject.asObservable();

  private readonly boardTasksSignal = toSignal(this.boardTasks$, { initialValue: this.boardTasksSubject.value });

  getTasks(boardId: string): Task[] {
    return this.boardTasksSignal()[boardId] ?? [];
  }

  getTasks$(boardId: string): Observable<Task[]> {
    return this.boardTasks$.pipe(map((all) => all[boardId] ?? []));
  }

  getTask(boardId: string, taskId: string): Task | undefined {
    return this.getTasks(boardId).find((task) => task.id === taskId);
  }

  getTask$(boardId: string, taskId: string): Observable<Task | undefined> {
    return this.getTasks$(boardId).pipe(map((tasks) => tasks.find((task) => task.id === taskId)));
  }

  // For the "no duplicate titles on a board" form validator — excludes the task itself so
  // saving an edit without changing its title doesn't flag against its own old value.
  otherTitles(boardId: string, excludeTaskId: string | null): string[] {
    return this.getTasks(boardId)
      .filter((task) => task.id !== excludeTaskId)
      .map((task) => task.title);
  }

  addTask(boardId: string, task: Omit<Task, 'id'>): Task {
    const newTask: Task = { ...task, id: `${slugify(task.title)}-${nextTaskSuffix++}` };
    this.boardTasksSubject.next({
      ...this.boardTasksSubject.value,
      [boardId]: [...(this.boardTasksSubject.value[boardId] ?? []), newTask],
    });
    return newTask;
  }

  updateTask(boardId: string, taskId: string, changes: Partial<Omit<Task, 'id'>>): void {
    this.boardTasksSubject.next({
      ...this.boardTasksSubject.value,
      [boardId]: (this.boardTasksSubject.value[boardId] ?? []).map((task) =>
        task.id === taskId ? { ...task, ...changes } : task,
      ),
    });
  }

  deleteTask(boardId: string, taskId: string): void {
    this.boardTasksSubject.next({
      ...this.boardTasksSubject.value,
      [boardId]: (this.boardTasksSubject.value[boardId] ?? []).filter((task) => task.id !== taskId),
    });
  }
}

function slugify(title: string): string {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'task';
}
