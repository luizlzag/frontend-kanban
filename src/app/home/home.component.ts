import { Component, inject, signal, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { BoardComponent } from '../board/board.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [BoardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  protected auth = inject(AuthService);
  private router = inject(Router);

  protected dropdownOpen = signal(false);

  toggleDropdown(): void {
    this.dropdownOpen.update((v) => !v);
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-dropdown')) {
      this.closeDropdown();
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  ngOnInit(): void {
    this.auth.fetchMe();
  }

  get avatarLetter(): string {
    const name = this.auth.username();
    return name ? name.charAt(0).toUpperCase() : '?';
  }
}
