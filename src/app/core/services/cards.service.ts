import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../api/api.config';
import type { Card } from '../models';

@Injectable({ providedIn: 'root' })
export class CardsService {
  private http = inject(HttpClient);

  private get url() {
    return `${API_URL}/cards`;
  }

  list() {
    return this.http.get<Card[]>(this.url);
  }

  listByColumn(columnId: string) {
    return this.http.get<Card[]>(`${this.url}/column/${columnId}`);
  }

  getById(id: string) {
    return this.http.get<Card>(`${this.url}/${id}`);
  }

  create(data: { title: string; content?: string; columnId: string }) {
    return this.http.post<Card>(this.url, data);
  }

  update(id: string, data: { title?: string; content?: string; columnId?: string }) {
    return this.http.patch<Card>(`${this.url}/${id}`, data);
  }

  move(id: string, columnId: string) {
    return this.http.patch<Card>(`${this.url}/${id}`, { columnId });
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
