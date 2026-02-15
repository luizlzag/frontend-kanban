export interface User {
  id: string;
  githubId: string;
  username: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Column {
  id: string;
  name: string;
  order: number;
  cards?: Card[];
  createdBy?: User;
}

export interface Card {
  id: string;
  title: string;
  content?: string;
  columnId: string;
  column?: Column;
  createdBy?: User;
}
