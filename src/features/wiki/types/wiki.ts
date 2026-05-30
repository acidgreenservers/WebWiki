export interface WikiPage {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  parentId: string | null;
  children: string[];
  tags?: string[];
  category?: string;
}