import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { BOARD_IDS } from './board-data';

// Single owner of "what boards exist" so Boards, BoardDetails, and Settings all read the same
// list instead of each importing BOARD_IDS from the fixture data directly.
//
// Backed by a ReplaySubject(1) rather than a plain field so any subscriber — including one that
// subscribes after the list was set — gets the current board list and every value after it.
@Injectable({ providedIn: 'root' })
export class BoardService {
  private readonly boardIdsSubject = new ReplaySubject<readonly string[]>(1);
  readonly boardIds$: Observable<readonly string[]> = this.boardIdsSubject.asObservable();

  readonly boardIds: readonly string[] = BOARD_IDS;

  constructor() {
    this.boardIdsSubject.next(this.boardIds);
  }

  boardExists(boardId: string): boolean {
    return this.boardIds.includes(boardId);
  }
}
