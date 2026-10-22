import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { BoardService } from './board.service';

describe('BoardService', () => {
  let service: BoardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BoardService);
  });

  it('exposes the seeded board ids', () => {
    expect(service.boardIds).toEqual(['platform-launch', 'marketing-plan', 'roadmap']);
  });

  it('confirms a known board exists', () => {
    expect(service.boardExists('roadmap')).toBe(true);
  });

  it('confirms an unknown board does not exist', () => {
    expect(service.boardExists('does-not-exist')).toBe(false);
  });

  it('streams the board list to subscribers via boardIds$', async () => {
    expect(await firstValueFrom(service.boardIds$)).toEqual(service.boardIds);
  });

  it('replays the current board list to a subscriber that joins late', async () => {
    // ReplaySubject(1): the list is pushed once in the constructor, before this test's
    // subscription exists — a late subscriber should still get it, not hang or miss it.
    expect(await firstValueFrom(service.boardIds$)).toEqual(service.boardIds);
  });
});
