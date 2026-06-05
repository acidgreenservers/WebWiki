export type WikiPageType = 'document' | 'folder';

export interface WikiPage {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  parentId: string | null;
  children: string[];
  type: WikiPageType;
  tags?: string[];
  category?: string;
}