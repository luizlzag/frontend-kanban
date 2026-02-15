import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../api/api.config';
import type { Column } from '../models';

@Injectable({ providedIn: 'root' })
export class ColumnsService {
  private http = inject(HttpClient);

  private get url() {
    return `${API_URL}/columns`;
  }

  list() {
    return this.http.get<Column[]>(this.url);
  }

  getById(id: string) {
    return this.http.get<Column>(`${this.url}/${id}`);
  }

  create(data: { name: string; order?: number }) {
    return this.http.post<Column>(this.url, data);
  }

  update(id: string, data: { name?: string; order?: number }) {
    return this.http.patch<Column>(`${this.url}/${id}`, data);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
