import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { NgIcon } from '@ng-icons/core';
import { Subject, takeUntil } from 'rxjs';
import { ColumnsService } from '../core/services/columns.service';
import { CardsService } from '../core/services/cards.service';
import { KanbanSocketService } from '../core/services/kanban-socket.service';
import type { Column, Card } from '../core/models';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [NgIcon, CdkDropListGroup, CdkDropList, CdkDrag],
  templateUrl: './board.component.html',
  styleUrl: './board.component.css',
})
export class BoardComponent implements OnInit, OnDestroy {
  private columnsSvc = inject(ColumnsService);
  private cardsSvc = inject(CardsService);
  private socketSvc = inject(KanbanSocketService);
  private destroy$ = new Subject<void>();

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
  protected updatingCardIds = signal<Set<string>>(new Set());
  protected creatingCardColumnId = signal<string | null>(null);
  protected creatingColumn = signal(false);

  ngOnInit(): void {
    this.loadColumns();
    this.socketSvc.connect();
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSocketListeners(): void {
    this.socketSvc.cardCreated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((card) => this.handleCardCreated(card));
    this.socketSvc.cardUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((card) => this.handleCardUpdated(card));
    this.socketSvc.cardDeleted$
      .pipe(takeUntil(this.destroy$))
      .subscribe((card) => this.handleCardDeleted(card));
    this.socketSvc.columnCreated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((col) => this.handleColumnCreated(col));
    this.socketSvc.columnUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((col) => this.handleColumnUpdated(col));
    this.socketSvc.columnDeleted$
      .pipe(takeUntil(this.destroy$))
      .subscribe((col) => this.handleColumnDeleted(col));
  }

  protected isCardUpdating(cardId: string): boolean {
    return this.updatingCardIds().has(cardId);
  }

  private addUpdatingCard(id: string): void {
    this.updatingCardIds.update((set) => new Set(set).add(id));
  }

  private removeUpdatingCard(id: string): void {
    this.updatingCardIds.update((set) => {
      const next = new Set(set);
      next.delete(id);
      return next;
    });
  }

  private handleCardCreated(card: Card): void {
    const columnId = card.columnId ?? card.column?.id;
    if (!columnId) return;
    this.columns.update((cols) => {
      const colIndex = cols.findIndex((c) => c.id === columnId);
      if (colIndex === -1) return cols;
      const newCols = cols.map((c, i) =>
        i === colIndex
          ? { ...c, cards: [...(c.cards || []), card] }
          : { ...c, cards: [...(c.cards || [])] }
      );
      return newCols.sort((a, b) => a.order - b.order);
    });
  }

  private handleCardUpdated(card: Card): void {
    this.removeUpdatingCard(card.id);
    const columnId = card.columnId ?? card.column?.id;
    if (!columnId) return;
    this.columns.update((cols) => {
      const newColIndex = cols.findIndex((c) => c.id === columnId);
      if (newColIndex === -1) return cols;

      return cols
        .map((c, i) => {
          const cards = (c.cards || []).filter((x) => x.id !== card.id);
          if (i === newColIndex) return { ...c, cards: [...cards, card] };
          return { ...c, cards };
        })
        .sort((a, b) => a.order - b.order);
    });
  }

  private handleCardDeleted(card: Card): void {
    this.removeUpdatingCard(card.id);
    this.columns.update((cols) =>
      cols.map((c) => ({
        ...c,
        cards: (c.cards || []).filter((x) => x.id !== card.id),
      }))
    );
  }

  private handleColumnCreated(column: Column): void {
    this.columns.update((cols) => {
      const exists = cols.some((c) => c.id === column.id);
      if (exists) return cols;
      return [...cols, column].sort((a, b) => a.order - b.order);
    });
  }

  private handleColumnUpdated(column: Column): void {
    this.columns.update((cols) =>
      cols.map((c) => (c.id === column.id ? column : c)).sort((a, b) => a.order - b.order)
    );
  }

  private handleColumnDeleted(column: Column): void {
    this.columns.update((cols) => cols.filter((c) => c.id !== column.id));
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
    this.creatingColumn.set(true);
    this.columnsSvc.create({ name, order }).subscribe({
      next: () => {
        this.creatingColumn.set(false);
        this.cancelAddColumn();
      },
      error: (err) => {
        this.creatingColumn.set(false);
        this.error.set(err.error?.message || 'Erro ao criar coluna');
      },
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
      next: () => this.cancelEditColumn(),
      error: (err) => this.error.set(err.error?.message || 'Erro ao atualizar coluna'),
    });
  }

  deleteColumn(col: Column): void {
    if (!confirm(`Excluir coluna "${col.name}" e todos os cards?`)) return;
    this.columnsSvc.delete(col.id).subscribe({
      next: () => {},
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
    this.creatingCardColumnId.set(columnId);
    this.cardsSvc.create({ title, content: this.newCardContent().trim() || undefined, columnId }).subscribe({
      next: () => {
        this.creatingCardColumnId.set(null);
        this.cancelAddCard();
      },
      error: (err) => {
        this.creatingCardColumnId.set(null);
        this.error.set(err.error?.message || 'Erro ao criar card');
      },
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
    this.addUpdatingCard(id);
    this.cardsSvc.update(id, { title, content: this.editCardContent().trim() || undefined }).subscribe({
      next: () => this.cancelEditCard(),
      error: (err) => {
        this.removeUpdatingCard(id);
        this.error.set(err.error?.message || 'Erro ao atualizar card');
      },
    });
  }

  startMoveCard(card: Card): void {
    this.movingCard.set(card.id);
  }

  cancelMoveCard(): void {
    this.movingCard.set(null);
  }

  moveCardTo(cardId: string, columnId: string): void {
    this.addUpdatingCard(cardId);
    this.cardsSvc.move(cardId, columnId).subscribe({
      next: () => this.cancelMoveCard(),
      error: (err) => {
        this.removeUpdatingCard(cardId);
        this.error.set(err.error?.message || 'Erro ao mover card');
      },
    });
  }

  deleteCard(card: Card): void {
    if (!confirm(`Excluir card "${card.title}"?`)) return;
    this.addUpdatingCard(card.id);
    this.cardsSvc.delete(card.id).subscribe({
      next: () => {},
      error: (err) => {
        this.removeUpdatingCard(card.id);
        this.error.set(err.error?.message || 'Erro ao excluir card');
      },
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

    const movedCard = { ...card, columnId: targetColumn.id, column: targetColumn };
    this.applyCardMove(card.id, movedCard, targetColumn.id);
    this.addUpdatingCard(card.id);
    this.cardsSvc.move(card.id, targetColumn.id).subscribe({
      next: () => this.cancelMoveCard(),
      error: (err) => {
        this.removeUpdatingCard(card.id);
        this.revertCardMove(card, sourceColumn.id);
        this.error.set(err?.error?.message || 'Erro ao mover card');
      },
    });
  }

  private applyCardMove(cardId: string, card: Card, targetColumnId: string): void {
    this.columns.update((cols) => {
      const newColIndex = cols.findIndex((c) => c.id === targetColumnId);
      if (newColIndex === -1) return cols;
      return cols
        .map((c, i) => {
          const cards = (c.cards || []).filter((x) => x.id !== cardId);
          if (i === newColIndex) return { ...c, cards: [...cards, card] };
          return { ...c, cards };
        })
        .sort((a, b) => a.order - b.order);
    });
  }

  private revertCardMove(card: Card, sourceColumnId: string): void {
    this.columns.update((cols) => {
      const sourceIndex = cols.findIndex((c) => c.id === sourceColumnId);
      if (sourceIndex === -1) return cols;
      const sourceCol = cols[sourceIndex];
      const restoredCard = { ...card, columnId: sourceColumnId, column: sourceCol };
      return cols.map((c, i) => {
        const cards = (c.cards || []).filter((x) => x.id !== card.id);
        if (i === sourceIndex) return { ...c, cards: [...cards, restoredCard] };
        return { ...c, cards };
      });
    });
  }
}
