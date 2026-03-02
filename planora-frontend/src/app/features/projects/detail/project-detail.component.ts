import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatProgressBarModule,
    MatSnackBarModule, MatTabsModule, LoadingComponent
  ],
  template: `
    <div class="page-container">
      <app-loading *ngIf="loading"></app-loading>
      <div *ngIf="!loading && project">
        <div class="page-header">
          <div>
            <h1>{{ project.name }}</h1>
            <p class="description">{{ project.description }}</p>
          </div>
          <button mat-button [routerLink]="['/projects']">
            <mat-icon>arrow_back</mat-icon> Back to Projects
          </button>
        </div>

        <div class="info-grid">
          <mat-card>
            <mat-card-content>
              <div class="info-row"><mat-icon>person</mat-icon><span><strong>Manager:</strong> {{ project.projectManagerName }}</span></div>
              <div class="info-row"><mat-icon>calendar_today</mat-icon><span><strong>Start:</strong> {{ project.startDate | date:'mediumDate' }}</span></div>
              <div class="info-row"><mat-icon>event</mat-icon><span><strong>End:</strong> {{ project.endDate | date:'mediumDate' }}</span></div>
              <div class="info-row"><mat-icon>task</mat-icon><span><strong>Tasks:</strong> {{ project.completedTasks }}/{{ project.totalTasks }} completed</span></div>
              <div class="progress-row">
                <mat-progress-bar mode="determinate" [value]="project.progressPercentage"></mat-progress-bar>
                <span>{{ project.progressPercentage | number:'1.0-0' }}%</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header><mat-card-title>Team Members</mat-card-title></mat-card-header>
            <mat-card-content>
              <mat-chip-set>
                <mat-chip *ngFor="let m of project.members">{{ m.fullName }}</mat-chip>
              </mat-chip-set>
              <p *ngIf="!project.members?.length" class="no-data">No members assigned</p>
            </mat-card-content>
          </mat-card>
        </div>

        <mat-card class="nav-card">
          <mat-card-header><mat-card-title>Project Navigation</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="nav-buttons">
              <button mat-raised-button color="primary" [routerLink]="['/projects', project.id, 'tasks']">
                <mat-icon>task</mat-icon> Tasks
              </button>
              <button mat-raised-button color="accent" [routerLink]="['/projects', project.id, 'sprints']">
                <mat-icon>directions_run</mat-icon> Sprints
              </button>
              <button mat-raised-button [routerLink]="['/projects', project.id, 'backlog']">
                <mat-icon>list</mat-icon> Backlog
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
      <div *ngIf="!loading && !project">
        <mat-card><mat-card-content>Project not found.</mat-card-content></mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    h1 { margin: 0 0 8px; }
    .description { color: #666; margin: 0; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .info-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .info-row mat-icon { color: #666; font-size: 18px; width: 18px; height: 18px; }
    .progress-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
    .progress-row mat-progress-bar { flex: 1; }
    .nav-buttons { display: flex; gap: 16px; }
    .no-data { color: #999; font-style: italic; }
    .nav-card { margin-top: 16px; }
  `]
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private snackBar = inject(MatSnackBar);

  loading = true;
  project: Project | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.projectService.getProject(id).subscribe({
      next: response => {
        this.loading = false;
        if (response.success) this.project = response.data;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load project', 'Close', { duration: 3000 });
      }
    });
  }
}
