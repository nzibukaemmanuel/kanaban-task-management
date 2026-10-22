# KanbanTaskManagementWebApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.5.

## State management

There's no backend behind this app yet — `board-data.ts` is the fixture every service and the
store both boot from — so "state management" here is about how the *client-side* copy of that
data flows between components, not about caching a real API response.

### Local vs. global state

- **Local**: form state inside `TaskForm` (dirty/touched, in-progress edits), the `Boards` quick-jump
  select, per-page filter/sort query params. None of it is needed outside the component that owns it.
- **Global**: the task list per board (read from `Boards`, `BoardDetails`, `TaskDetail`, `AddTask` and
  `EditTask` alike) and the board id list (read from `Boards`, `BoardDetails`, `Settings`). Both need
  to stay in sync everywhere the moment one place changes them.

### Hybrid strategy (bonus task)

Global state here is deliberately split across mechanisms rather than moved to NgRx wholesale — each
row below is chosen by what the state *is*, not by a blanket rule:

| State | Owner | Why |
|---|---|---|
| Tasks (per board) | **NgRx** (`features/board/store/`) — actions, a `createReducer` backed by `@ngrx/entity`'s `EntityAdapter`, selectors, and `TaskEffects` | Tasks are the app's actual CRUD surface (add/update/delete, filter, sort) — the kind of state that benefits from an explicit action log, time-travel debugging, and a normalized, id-keyed collection instead of `TaskService`'s `Record<boardId, Task[]>`. |
| Boards (which boards exist) | **Service-based** — `BoardService`'s `ReplaySubject<readonly string[]>` | The board list is fixed at boot and effectively never mutates at runtime. A full store slice (actions, reducer, selectors, effects) would be ceremony around a value that never changes — a `ReplaySubject` already gives every subscriber, including late ones, the current list. |
| UI / device state — theme, auth session, toast notifications, user preferences | **Service-based** — `ThemeService`, `AuthService`, `NotificationService`, `PreferencesService`, each a `signal()` (+ an `effect()` where it persists to `localStorage`) | This state belongs to *this browser tab*, not to the domain model: one mutation path per value (toggle theme, log in/out, dismiss a notice), no normalization, no multi-step flow, and no debugging value from an action log for "user clicked dark mode". A `providedIn: 'root'` service with a signal gives every consumer the same reactive value for a fraction of a store slice's code. |

This is the reverse of the textbook "NgRx for the big collections, services for one-off flags" split —
here it's Tasks (not Boards) that earns NgRx, because *task mutation count and reader count* is what
actually varies, not which entity sounds more like "the main feature."

### Trade-offs: NgRx vs. service-based state

**Complexity** — NgRx needs five files per slice (model, actions, reducer, selectors, effects) plus the
`provideStore`/`provideEffects` wiring in `app.config.ts`, and every mutation is an indirection chain:
dispatch → effect → service call → success action → reducer → selector → re-render. A service is one
`@Injectable` class with a `signal()` and a couple of methods — reading is `service.value()`, writing is
`service.method()`, no action types or reducer switch to keep in sync with the shape of state. Tasks have
four mutation paths (add/update/delete/load) read from five-plus components, so the NgRx indirection
documents itself; the board list and each UI-state service have exactly one mutation path (or none), so
the same indirection would have no story to tell.

**Scalability** — NgRx's normalized `EntityAdapter` state and parameterized selectors scale well as more
mutation paths, more entity types, or cross-cutting concerns (undo, optimistic updates, a real backend
with loading/error state) get added — a second entity type is largely a copy of the existing pattern, and
DevTools' time-travel keeps working regardless of state-tree size. Services scale fine in *count* (more
services, more signals) but each is its own silo: there's no single place to see everything a user action
changed once you have a dozen of them, and a mutation in one service triggering a change in another has to
be wired by hand instead of falling out of a shared reducer. At this app's actual scale (3 boards, ~15
tasks) neither approach is stressed — the split here is about the *shape future growth is likely to
take* (tasks: bulk actions, drag-and-drop reorder, server sync) rather than today's data volume.

**Developer productivity** — NgRx is slower to stand up for a first feature (more files, a vocabulary of
actions/effects/reducers/selectors to learn) but pays that back on every slice after the first, since a
contributor who's seen one NgRx feature in this repo can predict where to find any other, and the
DevTools action log replaces a lot of `console.log`-driven debugging as the CRUD surface grows. A service
is faster to add and faster to read cold — no vocabulary, the whole state lives in one file — but it
doesn't self-document mutation history, so "why did the theme flip to dark?" means grepping call sites
instead of reading a log; a non-issue for a handful of setters, a real cost past that. Matching each
state's shape to the tool built for that shape (Tasks → NgRx, everything else → services) gets the
productivity win from both: no boilerplate paid where it buys nothing, and no hand-rolled pub/sub
reinvented where NgRx already solves it.

### Task state — actions → effects → reducer → selectors

`TaskService` remains the actual data layer (an in-memory fixture today; swapping in a real HTTP-backed
service later wouldn't change anything above it). Components no longer inject it directly — they
dispatch `TaskActions` and read back through `store.selectSignal(...)`:

```
component.dispatch(TaskActions.addTask({ boardId, task }))
      │
      ▼
TaskEffects.addTask$  →  calls TaskService.addTask(...)  →  dispatches TaskActions.addTaskSuccess({ task })
      │
      ▼
taskReducer  →  taskAdapter.addOne(task, state)
      │
      ▼
selectAllTasks / selectTasksByBoard(boardId)  →  components re-render
```

- `task.actions.ts` — `Load Tasks`, `Add/Update/Delete Task` (+ their `Success`/`Failure` pairs), via `createActionGroup`.
- `task.reducer.ts` — `EntityAdapter<TaskEntity>`-backed `TaskState` (`TaskEntity` = `Task` + `boardId`), seeded from the same fixture `TaskService` boots from so the board never shows an empty loading state.
- `task.selectors.ts` — `selectAllTasks`, plus parameterized factories (`selectTasksByBoard`, `selectTaskByBoardAndId`, `selectOtherTitles`) for the boardId-scoped reads components actually need.
- `task.effects.ts` — the only place `TaskService` is called from now; turns each intent action into a `TaskService` call and a `Success`/`Failure` action.
- `testing.ts` — `provideTaskStoreForTests()`, the one place spec files get the same store/effects wiring `app.config.ts` provides for real.

### Debugging with NgRx DevTools

`provideStoreDevtools` is wired up in `app.config.ts` (`app.ts` dispatches `TaskActions.loadTasks()` on
boot so there's a real load action to see, not just the seeded state). With the
[Redux DevTools browser extension](https://github.com/reduxjs/redux-devtools) installed, `ng serve` and
opening the extension panel shows every dispatched action (`[Task] Add Task` → `[Task] Add Task
Success`, etc.) and the resulting state diff in real time.

### Testing

- `task.reducer.spec.ts` / `task.selectors.spec.ts` — pure state-shape tests, no Angular DI.
- `task.effects.spec.ts` — each effect against the real `TaskService`, using `provideMockActions`.
- Component specs (`boards.spec.ts`, `board-details.spec.ts`, `add-task.spec.ts`, `edit-task.spec.ts`,
  `task-detail.spec.ts`) and the router-level `task-form-routing.integration.spec.ts` dispatch actions
  or drive the UI and assert the store-backed reads update without a reload.

### Deployment

`netlify.toml` builds with `npm run build` and publishes `dist/Kanban-Task-Management-Web-App/browser`
with a SPA catch-all redirect. Deploying needs a Netlify (or Vercel) account connected to this repo —
run `netlify deploy --prod` (or push through the connected Git integration) from an authenticated
session.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
