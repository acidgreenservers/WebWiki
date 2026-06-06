import { WikiPage } from '@/features/wiki/types/wiki';
import JSZip from 'jszip';
import { TextExporter } from './exporters/TextExporter';
import { MarkdownExporter } from './exporters/MarkdownExporter';
import { HTMLExporter } from './exporters/HTMLExporter';

const DB_NAME = 'WebWikiDB';
const STORE_NAME = 'pages';
const DB_VERSION = 1;

export class WikiStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('parentId', 'parentId', { unique: false });
        }
      };
    });
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  async savePage(page: WikiPage): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        ...page,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPage(id: string): Promise<WikiPage | null> {
    const db = await this.getDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve({
            ...result,
            createdAt: new Date(result.createdAt),
            updatedAt: new Date(result.updatedAt)
          });
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPages(): Promise<WikiPage[]> {
    const db = await this.getDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const pages: WikiPage[] = await new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result.map(page => ({
          ...page,
          createdAt: new Date(page.createdAt),
          updatedAt: new Date(page.updatedAt)
        }));
        resolve(results);
      };
      
      request.onerror = () => reject(request.error);
    });

    // Check if migration is needed
    const needsMigration = pages.some(p => !p.type || p.content.includes('[['));
    if (needsMigration) {
      return this.migratePages(pages);
    }

    return pages;
  }

  private async migratePages(pages: WikiPage[]): Promise<WikiPage[]> {
    const migratedPages = pages.map(page => {
      let updatedContent = page.content;

      // Migrate [[Title]] to [Title](page-id)
      const wikiLinkRegex = /\[\[(.*?)\]\]/g;
      updatedContent = updatedContent.replace(wikiLinkRegex, (match, title) => {
        const targetPage = pages.find(p => p.title === title);
        if (targetPage) {
          return `[${title}](${targetPage.id})`;
        }
        return match;
      });

      return {
        ...page,
        type: page.type || 'document',
        content: updatedContent
      };
    });

    // Save migrated pages back to storage
    for (const page of migratedPages) {
      await this.savePage(page);
    }

    return migratedPages;
  }

  async deletePage(id: string): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteAllPages(): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async importPages(pages: WikiPage[]): Promise<void> {
    // Clear existing pages first
    await this.deleteAllPages();
    
    // Save all imported pages
    for (const page of pages) {
      await this.savePage(page);
    }
  }

  async exportSinglePage(format: 'text' | 'markdown' | 'html', page: WikiPage): Promise<void> {
    let content = '';
    let mimeType = 'text/plain';
    let extension = 'txt';

    switch (format) {
      case 'text':
        content = TextExporter.formatPage(page);
        break;
      case 'markdown':
        content = MarkdownExporter.formatPage(page);
        extension = 'md';
        break;
      case 'html':
        content = HTMLExporter.generateSinglePage(page);
        mimeType = 'text/html';
        extension = 'html';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    this.downloadBlob(blob, `${page.title.toLowerCase().replace(/\s+/g, '-')}.${extension}`);
  }

  async exportWikiZip(format: 'text' | 'markdown' | 'html', rootPage: WikiPage, allPages: WikiPage[]): Promise<void> {
    const collectedPages = this.collectDescendants(rootPage.id, allPages);

    if (format === 'html') {
      const htmlContent = HTMLExporter.generateReader(rootPage, collectedPages);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      this.downloadBlob(blob, `${rootPage.title.toLowerCase().replace(/\s+/g, '-')}-reader.html`);
      return;
    }

    const zip = new JSZip();
    const rootFolder = zip.folder(rootPage.title);
    if (!rootFolder) return;

    this.buildZipRecursive(rootPage, collectedPages, rootFolder, format);

    const content = await zip.generateAsync({ type: 'blob' });
    this.downloadBlob(content, `${rootPage.title.toLowerCase().replace(/\s+/g, '-')}-export.zip`);
  }

  private collectDescendants(id: string, allPages: WikiPage[]): WikiPage[] {
    const page = allPages.find(p => p.id === id);
    if (!page) return [];

    let results = [page];
    const children = allPages.filter(p => p.parentId === id);
    for (const child of children) {
      results = [...results, ...this.collectDescendants(child.id, allPages)];
    }
    return results;
  }

  private buildZipRecursive(
    page: WikiPage,
    subset: WikiPage[],
    currentFolder: JSZip,
    format: 'text' | 'markdown'
  ) {
    const extension = format === 'markdown' ? 'md' : 'txt';

    let content = '';
    if (format === 'markdown') {
      const rewritten = this.rewriteLinksToRelative(page.content, page, subset);
      content = MarkdownExporter.formatPage(page, rewritten);
    } else {
      content = TextExporter.formatPage(page);
    }
    currentFolder.file(`index.${extension}`, content);

    const children = subset.filter(p => p.parentId === page.id);
    for (const child of children) {
      const safeTitle = child.title.replace(/[/\\?%*:|"<>]/g, '-');
      const hasChildren = subset.some(p => p.parentId === child.id);

      if (child.type === 'folder' || hasChildren) {
        const childFolder = currentFolder.folder(safeTitle);
        if (childFolder) {
          this.buildZipRecursive(child, subset, childFolder, format);
        }
      } else {
        let childContent = '';
        if (format === 'markdown') {
          const rewritten = this.rewriteLinksToRelative(child.content, child, subset);
          childContent = MarkdownExporter.formatPage(child, rewritten);
        } else {
          childContent = TextExporter.formatPage(child);
        }
        currentFolder.file(`${safeTitle}.${extension}`, childContent);
      }
    }
  }

  private rewriteLinksToRelative(content: string, currentPage: WikiPage, subset: WikiPage[]): string {
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
    return content.replace(linkRegex, (match, text, targetId) => {
      const targetPage = subset.find(p => p.id === targetId);
      if (targetPage) {
        const path = MarkdownExporter.getRelativePath(currentPage, targetPage, subset);
        return `[${text}](${path})`;
      }
      return match;
    });
  }


  private downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async exportPages(format: 'text' | 'markdown' | 'html' | 'json', pages: WikiPage[]): Promise<void> {
    // Keep legacy for now or remove if not used.
    // The new exportWikiZip handles the new requirements.
    console.warn("exportPages is deprecated, use exportWikiZip");
  }
}