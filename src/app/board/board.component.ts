import { Component, inject, signal, OnInit } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { NgIcon } from '@ng-icons/core';
import { ColumnsService } from '../core/services/columns.service';
import { CardsService } from '../core/services/cards.service';
import type { Column, Card } from '../core/models';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [NgIcon, CdkDropListGroup, CdkDropList, CdkDrag],
  templateUrl: './board.component.html',
  styleUrl: './board.component.css',
})
export class BoardComponent implements OnInit {
  private columnsSvc = inject(ColumnsService);
  private cardsSvc = inject(CardsService);

  protected columns = signal<Column[]>([]);
  protected loading = signal(true);
  protected error = signal<string | null>(null);

  protected addingColumn = signal(false);
  protected newColumnName = signal('');
  protected addingCard = signal<string | null>(null);
  protected newCardTitle = signal('');
  protected newCardContent = signal('');
  protected editingColumn = signal<string | null>(null);
  protected editColumnName = signal('');
  protected editingCard = signal<string | null>(null);
  protected editCardTitle = signal('');
  protected editCardContent = signal('');
  protected movingCard = signal<string | null>(null);

  ngOnInit(): void {
    this.loadColumns();
  }

  loadColumns(): void {
    this.loading.set(true);
    this.error.set(null);
    this.columnsSvc.list().subscribe({
      next: (cols) => {
        const sorted = [...cols].sort((a, b) => a.order - b.order);
        this.columns.set(sorted);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Erro ao carregar colunas');
        this.loading.set(false);
      },
    });
  }

  startAddColumn(): void {
    this.addingColumn.set(true);
    this.newColumnName.set('');
  }

  cancelAddColumn(): void {
    this.addingColumn.set(false);
    this.newColumnName.set('');
  }

  saveColumn(): void {
    const name = this.newColumnName().trim();
    if (!name) return;
    const order = this.columns().length;
    this.columnsSvc.create({ name, order }).subscribe({
      next: () => {
        this.cancelAddColumn();
        this.loadColumns();
      },
      error: (err) => this.error.set(err.error?.message || 'Erro ao criar coluna'),
    });
  }

  startEditColumn(col: Column): void {
    this.editingColumn.set(col.id);
    this.editColumnName.set(col.name);
  }

  cancelEditColumn(): void {
    this.editingColumn.set(null);
    this.editColumnName.set('');
  }

  saveEditColumn(): void {
    const id = this.editingColumn();
    if (!id) return;
    const name = this.editColumnName().trim();
    if (!name) return;
    this.columnsSvc.update(id, { name }).subscribe({
      next: () => {
        this.cancelEditColumn();
        this.loadColumns();
      },
      error: (err) => this.error.set(err.error?.message || 'Erro ao atualizar coluna'),
    });
  }

  deleteColumn(col: Column): void {
    if (!confirm(`Excluir coluna "${col.name}" e todos os cards?`)) return;
    this.columnsSvc.delete(col.id).subscribe({
      next: () => this.loadColumns(),
      error: (err) => this.error.set(err.error?.message || 'Erro ao excluir coluna'),
    });
  }

  startAddCard(columnId: string): void {
    this.addingCard.set(columnId);
    this.newCardTitle.set('');
    this.newCardContent.set('');
  }

  cancelAddCard(): void {
    this.addingCard.set(null);
    this.newCardTitle.set('');
    this.newCardContent.set('');
  }

  saveCard(): void {
    const columnId = this.addingCard();
    if (!columnId) return;
    const title = this.newCardTitle().trim();
    if (!title) return;
    this.cardsSvc.create({ title, content: this.newCardContent().trim() || undefined, columnId }).subscribe({
      next: () => {
        this.cancelAddCard();
        this.loadColumns();
      },
      error: (err) => this.error.set(err.error?.message || 'Erro ao criar card'),
    });
  }

  startEditCard(card: Card): void {
    this.editingCard.set(card.id);
    this.editCardTitle.set(card.title);
    this.editCardContent.set(card.content || '');
  }

  cancelEditCard(): void {
    this.editingCard.set(null);
    this.editCardTitle.set('');
    this.editCardContent.set('');
  }

  saveEditCard(): void {
    const id = this.editingCard();
    if (!id) return;
    const title = this.editCardTitle().trim();
    if (!title) return;
    this.cardsSvc.update(id, { title, content: this.editCardContent().trim() || undefined }).subscribe({
      next: () => {
        this.cancelEditCard();
        this.loadColumns();
      },
      error: (err) => this.error.set(err.error?.message || 'Erro ao atualizar card'),
    });
  }

  startMoveCard(card: Card): void {
    this.movingCard.set(card.id);
  }

  cancelMoveCard(): void {
    this.movingCard.set(null);
  }

  moveCardTo(cardId: string, columnId: string): void {
    this.cardsSvc.move(cardId, columnId).subscribe({
      next: () => {
        this.cancelMoveCard();
        this.loadColumns();
      },
      error: (err) => this.error.set(err.error?.message || 'Erro ao mover card'),
    });
  }

  deleteCard(card: Card): void {
    if (!confirm(`Excluir card "${card.title}"?`)) return;
    this.cardsSvc.delete(card.id).subscribe({
      next: () => this.loadColumns(),
      error: (err) => this.error.set(err.error?.message || 'Erro ao excluir card'),
    });
  }

  getCardsForColumn(column: Column): Card[] {
    const cards = column.cards || [];
    return [...cards];
  }

  onCardDrop(event: CdkDragDrop<Column, Card>): void {
    const targetColumn = event.container.data as unknown as Column;
    const sourceColumn = event.previousContainer.data as unknown as Column;
    if (sourceColumn.id === targetColumn.id) return;
    const card = event.item.data as Card;
    if (card.columnId === targetColumn.id) return;

    this.cardsSvc.move(card.id, targetColumn.id).subscribe({
      next: () => this.loadColumns(),
      error: () => this.loadColumns(),
    });
  }
}
