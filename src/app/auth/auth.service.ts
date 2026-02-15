import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../core/api/api.config';
import type { User } from '../core/models';

const TOKEN_KEY = 'kanban_token';
const USER_KEY = 'kanban_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private readonly tokenSignal = signal<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
  );
  private readonly userSignal = signal<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(USER_KEY) : null
  );
  private readonly meSignal = signal<User | null>(null);

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly me = this.meSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  /** Retorna o username (de /me ou do user salvo) */
  readonly username = computed(() => {
    const meUser = this.meSignal();
    if (meUser?.username) return meUser.username;
    const raw = this.userSignal();
    if (!raw) return '';
    try {
      const parsed = JSON.parse(raw) as { username?: string };
      return parsed.username ?? raw;
    } catch {
      return raw;
    }
  });

  readonly avatarUrl = computed(() => this.meSignal()?.avatarUrl ?? null);

  readonly githubLoginUrl = `${API_URL}/auth/github`;

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

  /** Verifica sessão e atualiza dados do usuário (avatar, etc.) */
  fetchMe() {
    if (!this.tokenSignal()) return;
    this.http.get<User>(`${API_URL}/auth/me`).subscribe({
      next: (user) => this.meSignal.set(user),
      error: () => this.meSignal.set(null)
    });
  }
}
