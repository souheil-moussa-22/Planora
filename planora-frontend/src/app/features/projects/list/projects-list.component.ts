import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ProjectFormDialogComponent } from './project-form-dialog.component';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatPaginatorModule,
    MatProgressBarModule, MatSnackBarModule, MatDialogModule,
    MatTooltipModule, LoadingComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Projects</h1>
        <button mat-raised-button color="primary" (click)="openCreate()" *ngIf="canManage">
          <mat-icon>add</mat-icon> New Project
        </button>
      </div>
      <mat-card>
        <mat-card-content>
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search projects</mat-label>
            <input matInput [formControl]="searchCtrl" placeholder="Search...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <app-loading *ngIf="loading"></app-loading>
          <table mat-table [dataSource]="projects" class="full-width-table" *ngIf="!loading">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let p">
                <a [routerLink]="['/projects', p.id]" class="project-link">{{ p.name }}</a>
              </td>
            </ng-container>
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Description</th>
              <td mat-cell *matCellDef="let p">{{ p.description | slice:0:60 }}{{ p.description?.length > 60 ? '...' : '' }}</td>
            </ng-container>
            <ng-container matColumnDef="manager">
              <th mat-header-cell *matHeaderCellDef>Manager</th>
              <td mat-cell *matCellDef="let p">{{ p.projectManagerName }}</td>
            </ng-container>
            <ng-container matColumnDef="members">
              <th mat-header-cell *matHeaderCellDef>Members</th>
              <td mat-cell *matCellDef="let p">{{ p.members?.length || 0 }}</td>
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
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let p">
                <button mat-icon-button color="primary" [routerLink]="['/projects', p.id]" matTooltip="View">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button color="accent" (click)="openEdit(p)" *ngIf="canManage" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteProject(p)" *ngIf="isAdmin" matTooltip="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell" [attr.colspan]="displayedColumns.length" style="text-align:center;padding:24px">
                No projects found.
              </td>
            </tr>
          </table>
          <mat-paginator
            [length]="totalCount"
            [pageSize]="pageSize"
            [pageSizeOptions]="[5, 10, 20]"
            (page)="onPageChange($event)">
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h1 { margin: 0; }
    .search-field { width: 100%; margin-bottom: 16px; }
    .full-width-table { width: 100%; }
    .progress-cell { display: flex; align-items: center; gap: 8px; min-width: 120px; }
    .progress-pct { font-size: 0.85rem; min-width: 36px; }
    .project-link { color: #3f51b5; text-decoration: none; font-weight: 500; }
    .project-link:hover { text-decoration: underline; }
  `]
})
export class ProjectsListComponent implements OnInit {
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  projects: Project[] = [];
  totalCount = 0;
  pageSize = 10;
  currentPage = 1;
  loading = true;
  searchCtrl = new FormControl('');
  displayedColumns = ['name', 'description', 'manager', 'members', 'progress', 'actions'];

  get canManage(): boolean {
    return this.authService.hasRole(['Admin', 'ProjectManager']);
  }

  get isAdmin(): boolean {
    return this.authService.hasRole(['Admin']);
  }

  ngOnInit(): void {
    this.loadProjects();
    this.searchCtrl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.currentPage = 1;
      this.loadProjects();
    });
  }

  loadProjects(): void {
    this.loading = true;
    this.projectService.getProjects(this.currentPage, this.pageSize, this.searchCtrl.value || '').subscribe({
      next: response => {
        this.loading = false;
        if (response.success) {
          this.projects = response.data.items;
          this.totalCount = response.data.totalCount;
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load projects', 'Close', { duration: 3000 });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadProjects();
  }

  openCreate(): void {
    const ref = this.dialog.open(ProjectFormDialogComponent, { width: '500px', data: null });
    ref.afterClosed().subscribe(result => { if (result) this.loadProjects(); });
  }

  openEdit(project: Project): void {
    const ref = this.dialog.open(ProjectFormDialogComponent, { width: '500px', data: project });
    ref.afterClosed().subscribe(result => { if (result) this.loadProjects(); });
  }

  deleteProject(project: Project): void {
    if (!confirm(`Delete project "${project.name}"?`)) return;
    this.projectService.deleteProject(project.id).subscribe({
      next: response => {
        if (response.success) {
          this.snackBar.open('Project deleted', 'Close', { duration: 3000 });
          this.loadProjects();
        }
      },
      error: () => this.snackBar.open('Failed to delete project', 'Close', { duration: 3000 })
    });
  }
}
