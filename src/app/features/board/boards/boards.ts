import { Component, computed, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, map } from 'rxjs';
import { DataState } from '../../../shared/data-state/data-state';
import { SelectField, SelectFieldOption } from '../../../shared/select-field/select-field';
import { BoardDataStatus } from '../board-data-status';
import { BoardSidebar } from '../board-sidebar/board-sidebar';
import { BoardService } from '../board.service';
import { selectTasksByBoard } from '../store/task.selectors';

@Component({
  imports: [AsyncPipe, RouterLink, SelectField, BoardSidebar, DataState],
  selector: 'app-boards',
  styleUrl: './boards.css',
  templateUrl: './boards.html',
})
export class Boards {
  private readonly router = inject(Router);
  private readonly boardService = inject(BoardService);
  private readonly store = inject(Store);
  protected readonly dataStatus = inject(BoardDataStatus);

  readonly boardIds = this.boardService.boardIds;

  readonly boardOptions = computed<SelectFieldOption[]>(() => [
    { value: '', label: 'Choose a board…' },
    ...this.boardIds().map((boardId) => ({ value: boardId, label: boardId })),
  ]);

  jumpToBoard(boardId: string): void {
    if (!boardId) {
      return;
    }
    this.router.navigate(['/boards', boardId]);
  }

  // Streamed from the NgRx task store via the async pipe, so a task added/removed on a board's
  // detail page is reflected here the moment you navigate back — no local copy of the count, no
  // manual refresh. Each board's Observable is created once and memoized (rather than rebuilt in
  // a template method call) so the async pipe doesn't resubscribe on every change-detection run.
  private readonly taskCounts = new Map<string, Observable<number>>();

  taskCount$(boardId: string): Observable<number> {
    let count$ = this.taskCounts.get(boardId);
    if (!count$) {
      count$ = this.store.select(selectTasksByBoard(boardId)).pipe(map((tasks) => tasks.length));
      this.taskCounts.set(boardId, count$);
    }
    return count$;
  }
}
