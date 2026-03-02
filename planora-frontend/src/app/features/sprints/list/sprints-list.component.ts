import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SprintService } from '../../../core/services/sprint.service';
import { AuthService } from '../../../core/services/auth.service';
import { Sprint, SprintStatus } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { SprintFormDialogComponent } from './sprint-form-dialog.component';

@Component({
  selector: 'app-sprints-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatProgressBarModule,
    MatSnackBarModule, MatDialogModule, MatTooltipModule, LoadingComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <button mat-button [routerLink]="['/projects', projectId]">
            <mat-icon>arrow_back</mat-icon> Back to Project
          </button>
          <h1>Sprints</h1>
        </div>
        <button mat-raised-button color="primary" (click)="openCreate()" *ngIf="canManage">
          <mat-icon>add</mat-icon> New Sprint
        </button>
      </div>
      <mat-card>
        <mat-card-content>
          <app-loading *ngIf="loading"></app-loading>
          <table mat-table [dataSource]="sprints" class="full-width-table" *ngIf="!loading">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let s">{{ s.name }}</td>
            </ng-container>
            <ng-container matColumnDef="goal">
              <th mat-header-cell *matHeaderCellDef>Goal</th>
              <td mat-cell *matCellDef="let s">{{ s.goal | slice:0:40 }}{{ s.goal?.length > 40 ? '...' : '' }}</td>
            </ng-container>
            <ng-container matColumnDef="dates">
              <th mat-header-cell *matHeaderCellDef>Dates</th>
              <td mat-cell *matCellDef="let s">{{ s.startDate | date:'shortDate' }} – {{ s.endDate | date:'shortDate' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let s">
                <span class="chip" [ngClass]="getStatusClass(s.status)">{{ getStatusLabel(s.status) }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="tasks">
              <th mat-header-cell *matHeaderCellDef>Tasks</th>
              <td mat-cell *matCellDef="let s">{{ s.completedTasksCount }}/{{ s.tasksCount }}</td>
            </ng-container>
            <ng-container matColumnDef="progress">
              <th mat-header-cell *matHeaderCellDef>Progress</th>
              <td mat-cell *matCellDef="let s">
                <div class="progress-cell">
                  <mat-progress-bar mode="determinate" [value]="s.progressPercentage"></mat-progress-bar>
                  <span>{{ s.progressPercentage | number:'1.0-0' }}%</span>
                </div>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let s">
                <button mat-icon-button color="accent" (click)="openEdit(s)" *ngIf="canManage && s.status !== 2" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="primary" (click)="closeSprint(s)" *ngIf="canManage && s.status === 1" matTooltip="Close Sprint">
                  <mat-icon>lock</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteSprint(s)" *ngIf="canManage" matTooltip="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell" [attr.colspan]="displayedColumns.length" style="text-align:center;padding:24px">No sprints found.</td>
            </tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
    h1 { margin: 4px 0 0; }
    .full-width-table { width: 100%; }
    .chip { padding: 3px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 500; }
    .status-planning { background: #e3f2fd; color: #1976d2; }
    .status-active { background: #e8f5e9; color: #388e3c; }
    .status-closed { background: #f5f5f5; color: #666; }
    .progress-cell { display: flex; align-items: center; gap: 8px; min-width: 120px; }
  `]
})
export class SprintsListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private sprintService = inject(SprintService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  projectId = '';
  sprints: Sprint[] = [];
  loading = true;
  displayedColumns = ['name', 'goal', 'dates', 'status', 'tasks', 'progress', 'actions'];

  get canManage(): boolean {
    return this.authService.hasRole(['Admin', 'ProjectManager']);
  }

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('projectId')!;
    this.loadSprints();
  }

  loadSprints(): void {
    this.loading = true;
    this.sprintService.getSprintsByProject(this.projectId).subscribe({
      next: response => {
        this.loading = false;
        if (response.success) this.sprints = response.data;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load sprints', 'Close', { duration: 3000 });
      }
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(SprintFormDialogComponent, {
      width: '500px', data: { sprint: null, projectId: this.projectId }
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadSprints(); });
  }

  openEdit(sprint: Sprint): void {
    const ref = this.dialog.open(SprintFormDialogComponent, {
      width: '500px', data: { sprint, projectId: this.projectId }
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadSprints(); });
  }

  closeSprint(sprint: Sprint): void {
    if (!confirm(`Close sprint "${sprint.name}"?`)) return;
    this.sprintService.closeSprint(sprint.id).subscribe({
      next: response => {
        if (response.success) {
          this.snackBar.open('Sprint closed', 'Close', { duration: 3000 });
          this.loadSprints();
        }
      },
      error: () => this.snackBar.open('Failed to close sprint', 'Close', { duration: 3000 })
    });
  }

  deleteSprint(sprint: Sprint): void {
    if (!confirm(`Delete sprint "${sprint.name}"?`)) return;
    this.sprintService.deleteSprint(sprint.id).subscribe({
      next: response => {
        if (response.success) {
          this.snackBar.open('Sprint deleted', 'Close', { duration: 3000 });
          this.loadSprints();
        }
      },
      error: () => this.snackBar.open('Failed to delete sprint', 'Close', { duration: 3000 })
    });
  }

  getStatusLabel(status: SprintStatus): string {
    return ['Planning', 'Active', 'Closed'][status] ?? status.toString();
  }

  getStatusClass(status: SprintStatus): string {
    return ['status-planning', 'status-active', 'status-closed'][status] ?? '';
  }
}
