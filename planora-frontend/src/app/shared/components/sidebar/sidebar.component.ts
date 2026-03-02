import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatListModule, MatIconModule],
  template: `
    <nav class="sidebar">
      <mat-nav-list>
        <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link">
          <mat-icon matListItemIcon>dashboard</mat-icon>
          <span matListItemTitle>Dashboard</span>
        </a>
        <a mat-list-item routerLink="/projects" routerLinkActive="active-link">
          <mat-icon matListItemIcon>folder</mat-icon>
          <span matListItemTitle>Projects</span>
        </a>
        <a mat-list-item routerLink="/users" routerLinkActive="active-link" *ngIf="isAdmin">
          <mat-icon matListItemIcon>people</mat-icon>
          <span matListItemTitle>Users</span>
        </a>
      </mat-nav-list>
    </nav>
  `,
  styles: [`
    .sidebar {
      width: 240px;
      min-height: 100%;
      background: #f5f5f5;
      border-right: 1px solid #e0e0e0;
    }
    :host ::ng-deep .active-link {
      background: rgba(63, 81, 181, 0.1);
      color: #3f51b5;
    }
    :host ::ng-deep .active-link mat-icon {
      color: #3f51b5;
    }
  `]
})
export class SidebarComponent {
  private authService = inject(AuthService);

  get isAdmin(): boolean {
    return this.authService.hasRole(['Admin']);
  }
}
