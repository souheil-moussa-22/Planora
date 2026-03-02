import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardData, ProjectProgress } from '../../core/models';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatProgressBarModule,
    MatTableModule, MatIconModule, MatSnackBarModule, LoadingComponent
  ],
  template: `
    <div class="page-container">
      <h1>Dashboard</h1>
      <app-loading *ngIf="loading"></app-loading>
      <div *ngIf="!loading && data">
        <div class="stats-grid">
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon"><mat-icon color="primary">folder</mat-icon></div>
              <div class="stat-value">{{ data.totalProjects }}</div>
              <div class="stat-label">Total Projects</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon"><mat-icon color="accent">sprint</mat-icon></div>
              <div class="stat-value">{{ data.activeSprints }}</div>
              <div class="stat-label">Active Sprints</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon"><mat-icon color="primary">task</mat-icon></div>
              <div class="stat-value">{{ data.totalTasks }}</div>
              <div class="stat-label">Total Tasks</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon"><mat-icon style="color: #4caf50">check_circle</mat-icon></div>
              <div class="stat-value">{{ data.completedTasks }}</div>
              <div class="stat-label">Completed Tasks</div>
            </mat-card-content>
          </mat-card>
        </div>

        <mat-card class="progress-card">
          <mat-card-header>
            <mat-card-title>Overall Progress</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="progress-row">
              <span>{{ data.overallProgressPercentage | number:'1.0-0' }}%</span>
              <mat-progress-bar mode="determinate" [value]="data.overallProgressPercentage" class="progress-bar"></mat-progress-bar>
            </div>
            <div class="task-breakdown">
              <span class="task-chip todo">To Do: {{ data.toDoTasks }}</span>
              <span class="task-chip inprogress">In Progress: {{ data.inProgressTasks }}</span>
              <span class="task-chip done">Done: {{ data.completedTasks }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Projects Progress</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="data.projectsProgress" class="full-width-table">
              <ng-container matColumnDef="projectName">
                <th mat-header-cell *matHeaderCellDef>Project</th>
                <td mat-cell *matCellDef="let p">
                  <a [routerLink]="['/projects', p.projectId]">{{ p.projectName }}</a>
                </td>
              </ng-container>
              <ng-container matColumnDef="totalTasks">
                <th mat-header-cell *matHeaderCellDef>Total Tasks</th>
                <td mat-cell *matCellDef="let p">{{ p.totalTasks }}</td>
              </ng-container>
              <ng-container matColumnDef="completedTasks">
                <th mat-header-cell *matHeaderCellDef>Completed</th>
                <td mat-cell *matCellDef="let p">{{ p.completedTasks }}</td>
              </ng-container>
              <ng-container matColumnDef="progress">
                <th mat-header-cell *matHeaderCellDef>Progress</th>
                <td mat-cell *matCellDef="let p">
                  <div class="progress-cell">
                    <mat-progress-bar mode="determinate" [value]="p.progressPercentage"></mat-progress-bar>
                    <span class="progress-pct">{{ p.progressPercentage | number:'1.0-0' }}%</span>
                  </div>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    h1 { margin-bottom: 24px; color: #333; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { text-align: center; }
    .stat-icon mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .stat-value { font-size: 2rem; font-weight: 700; margin: 8px 0 4px; }
    .stat-label { color: #666; font-size: 0.9rem; }
    .progress-card { margin-bottom: 24px; }
    .progress-row { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
    .progress-bar { flex: 1; }
    .task-breakdown { display: flex; gap: 16px; }
    .task-chip { padding: 4px 12px; border-radius: 16px; font-size: 0.85rem; }
    .todo { background: #e3f2fd; color: #1976d2; }
    .inprogress { background: #fff3e0; color: #f57c00; }
    .done { background: #e8f5e9; color: #388e3c; }
    .full-width-table { width: 100%; }
    .progress-cell { display: flex; align-items: center; gap: 8px; min-width: 160px; }
    .progress-pct { font-size: 0.85rem; min-width: 36px; }
  `]
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private snackBar = inject(MatSnackBar);

  loading = true;
  data: DashboardData | null = null;
  displayedColumns = ['projectName', 'totalTasks', 'completedTasks', 'progress'];

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: response => {
        this.loading = false;
        if (response.success) this.data = response.data;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load dashboard', 'Close', { duration: 3000 });
      }
    });
  }
}
