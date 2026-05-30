import { WikiPage } from '@/features/wiki/types/wiki';

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
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        const pages = request.result.map(page => ({
          ...page,
          createdAt: new Date(page.createdAt),
          updatedAt: new Date(page.updatedAt)
        }));
        resolve(pages);
      };
      
      request.onerror = () => reject(request.error);
    });
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

  async exportPages(format: 'text' | 'markdown' | 'html' | 'json', pages: WikiPage[]): Promise<void> {
    let content = '';
    let mimeType = 'text/plain';
    let extension = 'txt';

    if (format === 'json') {
      content = JSON.stringify({ version: '1.0', pages }, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    } else if (format === 'markdown') {
      content = pages.map(p => `# ${p.title}\n\n${p.content}`).join('\n\n---\n\n');
      extension = 'md';
    } else if (format === 'html') {
      content = `<html><head><style>body{font-family:sans-serif;max-width:800px;margin:2em auto;line-height:1.6;padding:0 1em;}hr{margin:4em 0;}</style></head><body>` + 
                pages.map(p => `<h1>${p.title}</h1><div>${p.content}</div>`).join('<hr/>') + 
                `</body></html>`;
      mimeType = 'text/html';
      extension = 'html';
    } else {
      content = pages.map(p => `${p.title}\n${'='.repeat(p.title.length)}\n\n${p.content}`).join('\n\n\n');
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `webwiki-export-${new Date().toISOString().split('T')[0]}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}