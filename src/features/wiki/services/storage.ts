import { WikiPage } from '@/features/wiki/types/wiki';
import JSZip from 'jszip';

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

  async exportWikiZip(format: 'text' | 'markdown' | 'html', rootPage: WikiPage, allPages: WikiPage[]): Promise<void> {
    const zip = new JSZip();
    const collectedPages = this.collectDescendants(rootPage.id, allPages);

    if (format === 'html') {
      const htmlContent = this.generateSingleFileHtml(rootPage, collectedPages, allPages);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      this.downloadBlob(blob, `${rootPage.title.toLowerCase().replace(/\s+/g, '-')}-reader.html`);
      return;
    }

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

    // For the folder itself, we create an index file
    let content = page.content;
    if (format === 'markdown') {
      content = this.rewriteLinksToRelative(content, page, subset);
      content = `# ${page.title}\n\n${content}`;
    } else {
      content = `${page.title}\n${'='.repeat(page.title.length)}\n\n${content}`;
    }
    currentFolder.file(`index.${extension}`, content);

    const children = subset.filter(p => p.parentId === page.id);
    for (const child of children) {
      const safeTitle = child.title.replace(/[/\\?%*:|"<>]/g, '-');
      const hasChildren = subset.some(p => p.parentId === child.id);

      if (child.type === 'folder' || hasChildren) {
        // Create a directory for folders or documents with children
        const childFolder = currentFolder.folder(safeTitle);
        if (childFolder) {
          this.buildZipRecursive(child, subset, childFolder, format);
        }
      } else {
        // Simple document file
        let childContent = child.content;
        if (format === 'markdown') {
          childContent = this.rewriteLinksToRelative(childContent, child, subset);
          childContent = `# ${child.title}\n\n${childContent}`;
        } else {
          childContent = `${child.title}\n${'='.repeat(child.title.length)}\n\n${childContent}`;
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
        const path = this.getRelativePath(currentPage, targetPage, subset);
        return `[${text}](${path})`;
      }
      return match;
    });
  }

  private getRelativePath(fromPage: WikiPage, toPage: WikiPage, subset: WikiPage[]): string {
    const fromPath = this.getAncestry(fromPage, subset);
    const toPath = this.getAncestry(toPage, subset);

    // Find common ancestor
    let commonDepth = 0;
    while (commonDepth < fromPath.length && commonDepth < toPath.length && fromPath[commonDepth].id === toPath[commonDepth].id) {
      commonDepth++;
    }

    // A document is a file IF it has no children AND is not a folder
    const isFile = (p: WikiPage) => p.type === 'document' && !subset.some(child => child.parentId === p.id);

    // If fromPage is a directory, its file is index.md.
    // If it's a file, we are starting from the parent directory of that file.
    // Wait, if I'm at Folder/Doc.md and want to go to Folder/Other.md, it's ./Other.md.
    // If I'm at Folder/index.md and want to go to Folder/Doc.md, it's ./Doc.md.

    // Let's determine if fromPage is in its own directory or just a file in parent directory
    const fromIsFile = isFile(fromPage);
    const upSteps = (fromPath.length - commonDepth) - (fromIsFile ? 1 : 0);
    const dots = upSteps > 0 ? "../".repeat(upSteps) : "./";

    // Build the path down
    const segments = toPath.slice(commonDepth).map(p => p.title.replace(/[/\\?%*:|"<>]/g, '-'));
    const toIsFile = isFile(toPage);

    if (toIsFile) {
      // Just the filename
      return `${dots}${segments.join('/')}.md`;
    } else {
      // Directory + index.md
      return `${dots}${segments.join('/')}${segments.length > 0 ? '/' : ''}index.md`;
    }
  }

  private getAncestry(page: WikiPage, subset: WikiPage[]): WikiPage[] {
    const ancestry = [page];
    let current = page;
    while (current.parentId) {
      const parent = subset.find(p => p.id === current.parentId);
      if (!parent) break;
      ancestry.unshift(parent);
      current = parent;
    }
    return ancestry;
  }

  private generateSingleFileHtml(rootPage: WikiPage, subset: WikiPage[], allPages: WikiPage[]): string {
    const data = JSON.stringify(subset.map(p => ({
      ...p,
      // Ensure recursive children names/ids for navigation
      childPages: subset.filter(c => c.parentId === p.id).map(c => ({ id: c.id, title: c.title }))
    })));

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${rootPage.title} - WebWiki Reader</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --md-sys-color-primary: #3b6ef8;
            --md-sys-color-on-primary: #ffffff;
            --md-sys-color-surface: #0d1117;
            --md-sys-color-on-surface: #e6edf3;
            --md-sys-color-surface-variant: #161b22;
            --md-sys-color-outline: #30363d;
        }
        body {
            font-family: 'Roboto', sans-serif;
            background-color: var(--md-sys-color-surface);
            color: var(--md-sys-color-on-surface);
        }
        .prose {
            max-width: none;
            color: var(--md-sys-color-on-surface);
        }
        .prose h1, .prose h2, .prose h3 { color: var(--md-sys-color-primary); }
        .prose a { color: var(--md-sys-color-primary); text-decoration: none; }
        .prose a:hover { text-decoration: underline; }
        .sidebar-item.active {
            background-color: rgba(59, 110, 248, 0.1);
            border-left: 4px solid var(--md-sys-color-primary);
        }
    </style>
</head>
<body class="flex h-screen overflow-hidden">
    <!-- Sidebar -->
    <aside class="w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col">
        <div class="p-4 border-b border-[#30363d]">
            <h1 class="text-xl font-bold text-[#3b6ef8]">${rootPage.title}</h1>
            <p class="text-[10px] text-gray-500 uppercase tracking-widest mt-1">WebWiki Reader</p>
        </div>
        <nav id="sidebar" class="flex-1 overflow-y-auto p-2 space-y-1">
            <!-- Navigation items injected here -->
        </nav>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto bg-[#0d1117] p-8">
        <div id="content" class="max-w-4xl mx-auto prose prose-invert lg:prose-xl">
            <!-- Content injected here -->
        </div>
    </main>

    <script>
        const pages = ${data};
        const rootId = "${rootPage.id}";
        let currentPageId = rootId;

        function renderSidebar() {
            const sidebar = document.getElementById('sidebar');
            sidebar.innerHTML = '';

            function buildTree(parentId, level = 0) {
                const children = pages.filter(p => p.parentId === parentId);
                children.forEach(page => {
                    const div = document.createElement('div');
                    div.className = \`sidebar-item p-2 rounded cursor-pointer hover:bg-gray-800 transition-colors \${page.id === currentPageId ? 'active' : ''}\`;
                    div.style.paddingLeft = \`\${level * 16 + 8}px\`;
                    div.innerHTML = \`<span class="text-sm">\${page.type === 'folder' ? '📁 ' : '📄 '}\${page.title}</span>\`;
                    div.onclick = () => navigateTo(page.id);
                    sidebar.appendChild(div);
                    buildTree(page.id, level + 1);
                });
            }

            // Render root page first
            const root = pages.find(p => p.id === rootId);
            if (root) {
                const div = document.createElement('div');
                div.className = \`sidebar-item p-2 rounded cursor-pointer hover:bg-gray-800 transition-colors \${root.id === currentPageId ? 'active' : ''}\`;
                div.innerHTML = \`<span class="font-bold text-sm">🏠 \${root.title}</span>\`;
                div.onclick = () => navigateTo(root.id);
                sidebar.appendChild(div);
                buildTree(rootId, 1);
            }
        }

        function navigateTo(id) {
            currentPageId = id;
            const page = pages.find(p => p.id === id);
            if (!page) return;

            const contentDiv = document.getElementById('content');

            // Rewrite internal links in content for the reader
            let renderedContent = page.content;
            const linkRegex = /\\[(.*?)\\]\\((.*?)\\)/g;
            renderedContent = renderedContent.replace(linkRegex, (match, text, targetId) => {
                const targetExists = pages.some(p => p.id === targetId);
                if (targetExists) {
                    return \`<a href="javascript:navigateTo('\${targetId}')">\${text}</a>\`;
                }
                return match;
            });

            contentDiv.innerHTML = \`
                <h1 class="text-4xl font-bold mb-4 border-b border-gray-800 pb-4">\${page.title}</h1>
                <div class="mt-4 text-gray-300">\${DOMPurify.sanitize(marked.parse(renderedContent))}</div>
            \`;

            renderSidebar();
            window.scrollTo(0, 0);
        }

        // Initialize
        navigateTo(rootId);
    </script>
</body>
</html>
    `;
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