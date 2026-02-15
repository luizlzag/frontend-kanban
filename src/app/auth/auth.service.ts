import { Injectable, signal, computed } from '@angular/core';

const TOKEN_KEY = 'kanban_token';
const USER_KEY = 'kanban_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenSignal = signal<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
  );
  private readonly userSignal = signal<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(USER_KEY) : null
  );

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  /** Retorna apenas o username do objeto user (quando user é JSON) */
  readonly username = computed(() => {
    const raw = this.userSignal();
    if (!raw) return '';
    try {
      const parsed = JSON.parse(raw) as { username?: string };
      return parsed.username ?? raw;
    } catch {
      return raw;
    }
  });

  readonly githubLoginUrl = 'https://backend-kanban-bhsz.onrender.com/auth/github';

  saveAuth(token: string, user: string): void {
    this.tokenSignal.set(token);
    this.userSignal.set(user);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, user);
    }
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }

  getToken(): string | null {
    return this.tokenSignal();
  }
}
