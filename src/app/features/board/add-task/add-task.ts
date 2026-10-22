import { Component, computed, inject, input, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ComponentWithUnsavedChanges } from '../../../core/unsaved-changes.guard';
import { NotificationService } from '../../../core/notification.service';
import { TaskForm, TaskFormValue } from '../task-form/task-form';
import { TaskActions } from '../store/task.actions';
import { selectAllTasks } from '../store/task.selectors';

@Component({
  imports: [TaskForm],
  selector: 'app-add-task',
  styleUrl: './add-task.css',
  templateUrl: './add-task.html',
})
export class AddTask implements ComponentWithUnsavedChanges {
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly notificationService = inject(NotificationService);

  readonly boardId = input('');

  private readonly allTasks = this.store.selectSignal(selectAllTasks);

  readonly existingTitles = computed(() =>
    this.allTasks()
      .filter((task) => task.boardId === this.boardId())
      .map((task) => task.title),
  );

  private readonly taskForm = viewChild(TaskForm);

  hasUnsavedChanges(): boolean {
    return this.taskForm()?.isDirty() ?? false;
  }

  onSave(value: TaskFormValue): void {
    this.store.dispatch(TaskActions.addTask({ boardId: this.boardId(), task: value }));
    this.notificationService.success(`"${value.title}" was added.`);
    this.goToBoard();
  }

  onCancel(): void {
    this.goToBoard();
  }

  private goToBoard(): void {
    this.router.navigate(['/boards', this.boardId()]);
  }
}
