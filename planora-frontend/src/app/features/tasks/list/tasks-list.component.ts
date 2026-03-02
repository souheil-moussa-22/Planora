import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { Task, TaskStatus, TaskPriority } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { TaskFormDialogComponent } from './task-form-dialog.component';

@Component({
  selector: 'app-tasks-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatChipsModule, MatPaginatorModule,
    MatSnackBarModule, MatDialogModule, MatTooltipModule, LoadingComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <button mat-button [routerLink]="['/projects', projectId]">
            <mat-icon>arrow_back</mat-icon> Back to Project
          </button>
          <h1>Tasks</h1>
        </div>
        <button mat-raised-button color="primary" (click)="openCreate()">
          <mat-icon>add</mat-icon> New Task
        </button>
      </div>
      <mat-card>
        <mat-card-content>
          <app-loading *ngIf="loading"></app-loading>
          <table mat-table [dataSource]="tasks" class="full-width-table" *ngIf="!loading">
            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Title</th>
              <td mat-cell *matCellDef="let t">{{ t.title }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let t">
                <span class="chip" [ngClass]="getStatusClass(t.status)">{{ getStatusLabel(t.status) }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="priority">
              <th mat-header-cell *matHeaderCellDef>Priority</th>
              <td mat-cell *matCellDef="let t">
                <span class="chip" [ngClass]="getPriorityClass(t.priority)">{{ getPriorityLabel(t.priority) }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="assignedTo">
              <th mat-header-cell *matHeaderCellDef>Assigned To</th>
              <td mat-cell *matCellDef="let t">{{ t.assignedToName || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="dueDate">
              <th mat-header-cell *matHeaderCellDef>Due Date</th>
              <td mat-cell *matCellDef="let t">{{ t.dueDate ? (t.dueDate | date:'mediumDate') : '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let t">
                <button mat-icon-button color="accent" (click)="openEdit(t)" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteTask(t)" *ngIf="canManage" matTooltip="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell" [attr.colspan]="displayedColumns.length" style="text-align:center;padding:24px">No tasks found.</td>
            </tr>
          </table>
          <mat-paginator [length]="totalCount" [pageSize]="pageSize" [pageSizeOptions]="[5,10,20]" (page)="onPageChange($event)"></mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
    h1 { margin: 4px 0 0; }
    .full-width-table { width: 100%; }
    .chip { padding: 3px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 500; }
    .status-todo { background: #e3f2fd; color: #1976d2; }
    .status-inprogress { background: #fff3e0; color: #f57c00; }
    .status-done { background: #e8f5e9; color: #388e3c; }
    .priority-low { background: #f3e5f5; color: #7b1fa2; }
    .priority-medium { background: #e3f2fd; color: #1565c0; }
    .priority-high { background: #fff3e0; color: #e65100; }
    .priority-critical { background: #ffebee; color: #c62828; }
  `]
})
export class TasksListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  projectId = '';
  tasks: Task[] = [];
  totalCount = 0;
  pageSize = 10;
  currentPage = 1;
  loading = true;
  displayedColumns = ['title', 'status', 'priority', 'assignedTo', 'dueDate', 'actions'];

  get canManage(): boolean {
    return this.authService.hasRole(['Admin', 'ProjectManager']);
  }

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('projectId')!;
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading = true;
    this.taskService.getTasksByProject(this.projectId, this.currentPage, this.pageSize).subscribe({
      next: response => {
        this.loading = false;
        if (response.success) {
          this.tasks = response.data.items;
          this.totalCount = response.data.totalCount;
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load tasks', 'Close', { duration: 3000 });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadTasks();
  }

  openCreate(): void {
    const ref = this.dialog.open(TaskFormDialogComponent, {
      width: '500px',
      data: { task: null, projectId: this.projectId }
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadTasks(); });
  }

  openEdit(task: Task): void {
    const ref = this.dialog.open(TaskFormDialogComponent, {
      width: '500px',
      data: { task, projectId: this.projectId }
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadTasks(); });
  }

  deleteTask(task: Task): void {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    this.taskService.deleteTask(task.id).subscribe({
      next: response => {
        if (response.success) {
          this.snackBar.open('Task deleted', 'Close', { duration: 3000 });
          this.loadTasks();
        }
      },
      error: () => this.snackBar.open('Failed to delete task', 'Close', { duration: 3000 })
    });
  }

  getStatusLabel(status: TaskStatus): string {
    return ['To Do', 'In Progress', 'Done'][status] ?? status.toString();
  }

  getStatusClass(status: TaskStatus): string {
    return ['status-todo', 'status-inprogress', 'status-done'][status] ?? '';
  }

  getPriorityLabel(priority: TaskPriority): string {
    return ['Low', 'Medium', 'High', 'Critical'][priority] ?? priority.toString();
  }

  getPriorityClass(priority: TaskPriority): string {
    return ['priority-low', 'priority-medium', 'priority-high', 'priority-critical'][priority] ?? '';
  }
}
