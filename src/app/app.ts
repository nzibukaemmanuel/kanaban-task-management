import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthService } from './core/auth.service';
import { ThemeService } from './core/theme.service';
import { TaskActions } from './features/board/store/task.actions';
import { Notice } from './shared/notice/notice';

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Notice],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  protected readonly auth = inject(AuthService);
  // Injected eagerly here (rather than only where a component happens to need it) so the
  // theme is applied to <html> as early in bootstrap as possible, minimizing any flash of
  // the wrong theme on load.
  protected readonly themeService = inject(ThemeService);

  protected readonly isNavigating = signal(false);
  protected readonly navigationError = signal<string | null>(null);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => this.onRouterEvent(event));
    // The store's task state is already seeded from the same fixture TaskService boots from
    // (see task.reducer.ts), so this isn't needed for the app to have data — it exists so the
    // load → effect → reducer round trip is a real, observable action in NgRx DevTools rather
    // than something that only exists on paper.
    this.store.dispatch(TaskActions.loadTasks());
  }

  protected onRouterEvent(event: unknown): void {
    if (event instanceof NavigationStart) {
      // Route change requested — start of the navigation lifecycle.
      this.isNavigating.set(true);
      this.navigationError.set(null);
    } else if (event instanceof NavigationEnd || event instanceof NavigationCancel) {
      // Completed (NavigationEnd) or aborted, e.g. by a guard (NavigationCancel).
      this.isNavigating.set(false);
    } else if (event instanceof NavigationError) {
      // A guard/resolver/lazy-chunk load threw — surface it instead of leaving the UI stuck loading.
      this.isNavigating.set(false);
      this.navigationError.set('Something went wrong while loading that page.');
    }
  }

  protected dismissError(): void {
    this.navigationError.set(null);
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/boards']);
  }
}
