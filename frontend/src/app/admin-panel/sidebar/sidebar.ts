import { Component, Output, EventEmitter, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.html'
})
export class Sidebar {
  @Input() isMobileMenuOpen: boolean = false;
  @Output() sidebarClose = new EventEmitter<void>();

  constructor(private router: Router) {}

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  closeSidebar() {
    this.sidebarClose.emit();
  }
}
