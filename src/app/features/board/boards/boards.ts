import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, map } from 'rxjs';
import { SelectField, SelectFieldOption } from '../../../shared/select-field/select-field';
import { BoardSidebar } from '../board-sidebar/board-sidebar';
import { BoardService } from '../board.service';
import { selectTasksByBoard } from '../store/task.selectors';

@Component({
  imports: [AsyncPipe, RouterLink, SelectField, BoardSidebar],
  selector: 'app-boards',
  styleUrl: './boards.css',
  templateUrl: './boards.html',
})
export class Boards {
  private readonly router = inject(Router);
  private readonly boardService = inject(BoardService);
  private readonly store = inject(Store);

  readonly boardIds = this.boardService.boardIds;

  readonly boardOptions: SelectFieldOption[] = [
    { value: '', label: 'Choose a board…' },
    ...this.boardIds.map((boardId) => ({ value: boardId, label: boardId })),
  ];

  jumpToBoard(boardId: string): void {
    if (!boardId) {
      return;
    }
    this.router.navigate(['/boards', boardId]);
  }

  // Streamed from the NgRx task store via the async pipe, so a task added/removed on a board's
  // detail page is reflected here the moment you navigate back — no local copy of the count, no
  // manual refresh. Built once (rather than as a template method call) so each board keeps the
  // same Observable instance across change-detection runs and the async pipe doesn't
  // resubscribe on every cycle.
  private readonly taskCounts = new Map<string, Observable<number>>(
    this.boardIds.map((boardId) => [
      boardId,
      this.store.select(selectTasksByBoard(boardId)).pipe(map((tasks) => tasks.length)),
    ]),
  );

  taskCount$(boardId: string): Observable<number> | undefined {
    return this.taskCounts.get(boardId);
  }
}
