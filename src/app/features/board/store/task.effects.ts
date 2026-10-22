import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, take } from 'rxjs';
import { TaskService } from '../task.service';
import { TaskActions } from './task.actions';
import { TaskEntity } from './task.model';

// The only place task.service.ts is called from, now that components dispatch actions instead
// of injecting TaskService directly. TaskService stays the actual data layer (today: an
// in-memory fixture; a real backend would slot in behind the same three methods without any of
// this changing) — these effects are the action → data-layer → result-action bridge, and the
// reducer is the only thing that turns a result action into new state.
@Injectable()
export class TaskEffects {
  private readonly actions$ = inject(Actions);
  private readonly taskService = inject(TaskService);

  loadTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.loadTasks),
      switchMap(() =>
        this.taskService.boardTasks$.pipe(
          take(1),
          map((byBoard) => {
            const tasks: TaskEntity[] = Object.entries(byBoard).flatMap(([boardId, boardTasks]) =>
              boardTasks.map((task) => ({ ...task, boardId })),
            );
            return TaskActions.loadTasksSuccess({ tasks });
          }),
          catchError((error: unknown) =>
            of(TaskActions.loadTasksFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  );

  addTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.addTask),
      map(({ boardId, task }) => {
        try {
          const added = this.taskService.addTask(boardId, task);
          return TaskActions.addTaskSuccess({ task: { ...added, boardId } });
        } catch (error) {
          return TaskActions.addTaskFailure({ error: String(error) });
        }
      }),
    ),
  );

  updateTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.updateTask),
      map(({ boardId, taskId, changes }) => {
        try {
          this.taskService.updateTask(boardId, taskId, changes);
          return TaskActions.updateTaskSuccess({
            update: { id: taskId, changes: { ...changes, boardId } },
          });
        } catch (error) {
          return TaskActions.updateTaskFailure({ error: String(error) });
        }
      }),
    ),
  );

  deleteTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.deleteTask),
      map(({ boardId, taskId }) => {
        try {
          this.taskService.deleteTask(boardId, taskId);
          return TaskActions.deleteTaskSuccess({ taskId });
        } catch (error) {
          return TaskActions.deleteTaskFailure({ error: String(error) });
        }
      }),
    ),
  );
}
