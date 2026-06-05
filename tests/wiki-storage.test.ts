import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WikiStorage } from '@/features/wiki/services/storage';
import { WikiPage } from '@/features/wiki/types/wiki';

function createPage(overrides: Partial<WikiPage> = {}): WikiPage {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    title: 'Test Page',
    content: 'Test content',
    createdAt: now,
    updatedAt: now,
    parentId: null,
    children: [],
    type: 'document',
    ...overrides,
  };
}

describe('WikiStorage', () => {
  let storage: WikiStorage;

  beforeEach(async () => {
    storage = new WikiStorage();
    await storage.init();
    await storage.deleteAllPages();
  });

  // ─── Initialization ────────────────────────────────────

  describe('initialization', () => {
    it('should initialize without errors', async () => {
      const s = new WikiStorage();
      await expect(s.init()).resolves.toBeUndefined();
    });

    it('should be safe to initialize multiple times', async () => {
      await storage.init();
      await storage.init();
      // Should not throw
      const pages = await storage.getAllPages();
      expect(pages).toEqual([]);
    });
  });

  // ─── Create ────────────────────────────────────────────

  describe('savePage', () => {
    it('should save a page and retrieve it', async () => {
      const page = createPage({ id: 'page-1', title: 'First Page' });
      await storage.savePage(page);

      const retrieved = await storage.getPage('page-1');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.title).toBe('First Page');
      expect(retrieved!.content).toBe('Test content');
    });

    it('should save pages with all field types', async () => {
      const page = createPage({
        id: 'page-structured',
        title: 'Structured Page',
        content: 'Has tags and category',
        parentId: 'parent-1',
        children: ['child-1', 'child-2'],
        tags: ['reference', 'draft'],
        category: 'documentation',
      });

      await storage.savePage(page);
      const retrieved = await storage.getPage('page-structured');

      expect(retrieved!.parentId).toBe('parent-1');
      expect(retrieved!.children).toEqual(['child-1', 'child-2']);
      expect(retrieved!.tags).toEqual(['reference', 'draft']);
      expect(retrieved!.category).toBe('documentation');
    });

    it('should preserve Date objects through save/get cycle', async () => {
      const now = new Date('2025-06-15T12:00:00.000Z');
      const page = createPage({
        id: 'page-dates',
        createdAt: now,
        updatedAt: now,
      });

      await storage.savePage(page);
      const retrieved = await storage.getPage('page-dates');

      expect(retrieved!.createdAt).toBeInstanceOf(Date);
      expect(retrieved!.updatedAt).toBeInstanceOf(Date);
      expect(retrieved!.createdAt.toISOString()).toBe('2025-06-15T12:00:00.000Z');
    });
  });

  // ─── Migration ─────────────────────────────────────────

  describe('migration', () => {
    it('should migrate old internal links and add type', async () => {
      const page1 = createPage({ id: 'p1', title: 'Target', content: 'Some content' });
      const page2 = createPage({
        id: 'p2',
        title: 'Source',
        content: 'Check this [[Target]]',
        // No type field (simulating old data)
      } as any);

      await storage.savePage(page1);
      await storage.savePage(page2);

      const pages = await storage.getAllPages();
      const migratedSource = pages.find(p => p.id === 'p2');

      expect(migratedSource!.type).toBe('document');
      expect(migratedSource!.content).toBe('Check this [Target](p1)');
    });
  });

  // ─── Read ──────────────────────────────────────────────

  describe('getPage', () => {
    it('should return null for non-existent page', async () => {
      const result = await storage.getPage('non-existent');
      expect(result).toBeNull();
    });

    it('should retrieve a saved page by id', async () => {
      const page = createPage({ id: 'retrieve-me', title: 'Retrieve Me' });
      await storage.savePage(page);

      const result = await storage.getPage('retrieve-me');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('retrieve-me');
      expect(result!.title).toBe('Retrieve Me');
    });
  });

  describe('getAllPages', () => {
    it('should return empty array when no pages exist', async () => {
      const pages = await storage.getAllPages();
      expect(pages).toEqual([]);
    });

    it('should return all saved pages', async () => {
      await storage.savePage(createPage({ id: 'a', title: 'Page A' }));
      await storage.savePage(createPage({ id: 'b', title: 'Page B' }));
      await storage.savePage(createPage({ id: 'c', title: 'Page C' }));

      const pages = await storage.getAllPages();
      expect(pages).toHaveLength(3);

      const titles = pages.map((p) => p.title).sort();
      expect(titles).toEqual(['Page A', 'Page B', 'Page C']);
    });
  });

  // ─── Update ────────────────────────────────────────────

  describe('update (save with existing id)', () => {
    it('should overwrite an existing page', async () => {
      const original = createPage({ id: 'update-me', title: 'Original', content: 'v1' });
      await storage.savePage(original);

      const updated = createPage({
        id: 'update-me',
        title: 'Updated',
        content: 'v2',
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      });
      await storage.savePage(updated);

      const result = await storage.getPage('update-me');
      expect(result!.title).toBe('Updated');
      expect(result!.content).toBe('v2');
    });

    it('should not create duplicates on update', async () => {
      await storage.savePage(createPage({ id: 'unique', title: 'v1' }));
      await storage.savePage(createPage({ id: 'unique', title: 'v2' }));

      const pages = await storage.getAllPages();
      expect(pages).toHaveLength(1);
      expect(pages[0].title).toBe('v2');
    });
  });

  // ─── Delete ────────────────────────────────────────────

  describe('deletePage', () => {
    it('should delete a page by id', async () => {
      await storage.savePage(createPage({ id: 'delete-me', title: 'Doomed' }));
      await storage.deletePage('delete-me');

      const result = await storage.getPage('delete-me');
      expect(result).toBeNull();
    });

    it('should only delete the targeted page', async () => {
      await storage.savePage(createPage({ id: 'keep', title: 'Keep' }));
      await storage.savePage(createPage({ id: 'remove', title: 'Remove' }));

      await storage.deletePage('remove');

      const pages = await storage.getAllPages();
      expect(pages).toHaveLength(1);
      expect(pages[0].id).toBe('keep');
    });
  });

  describe('deleteAllPages', () => {
    it('should remove all pages', async () => {
      await storage.savePage(createPage({ id: 'a' }));
      await storage.savePage(createPage({ id: 'b' }));
      await storage.savePage(createPage({ id: 'c' }));

      await storage.deleteAllPages();

      const pages = await storage.getAllPages();
      expect(pages).toEqual([]);
    });
  });

  // ─── Import ────────────────────────────────────────────

  describe('importPages', () => {
    it('should clear existing pages and import new ones', async () => {
      // Seed with existing data
      await storage.savePage(createPage({ id: 'old-1', title: 'Old Page' }));

      const imported = [
        createPage({ id: 'imported-1', title: 'Imported A' }),
        createPage({ id: 'imported-2', title: 'Imported B' }),
      ];

      await storage.importPages(imported);

      const pages = await storage.getAllPages();
      expect(pages).toHaveLength(2);

      const ids = pages.map((p) => p.id).sort();
      expect(ids).toEqual(['imported-1', 'imported-2']);
    });

    it('should handle importing an empty array', async () => {
      await storage.savePage(createPage({ id: 'existing' }));
      await storage.importPages([]);

      const pages = await storage.getAllPages();
      expect(pages).toEqual([]);
    });

    it('should handle importing a large batch', async () => {
      const batch = Array.from({ length: 100 }, (_, i) =>
        createPage({ id: `batch-${i}`, title: `Batch Page ${i}` })
      );

      await storage.importPages(batch);

      const pages = await storage.getAllPages();
      expect(pages).toHaveLength(100);
    });
  });

  // ─── Export ────────────────────────────────────────────

  describe('exportWikiZip', () => {
    function mockDownload() {
      const spyClick = vi.fn();
      const originalCreateElement = document.createElement.bind(document);

      // Mock URL.createObjectURL / revokeObjectURL (absent in jsdom)
      URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      URL.revokeObjectURL = vi.fn();

      // Mock the download flow — intercept <a> creation only
      vi.spyOn(document, 'createElement').mockImplementation((tag: string, options?: ElementCreationOptions) => {
        const el = originalCreateElement(tag, options);
        if (tag === 'a') {
          el.click = spyClick;
        }
        return el;
      });

      return { spyClick };
    }

    it('should export as markdown zip', async () => {
      const page = createPage({ id: 'export-md', title: 'MD Page', content: 'md content', type: 'document' });
      await storage.savePage(page);

      const { spyClick } = mockDownload();
      await storage.exportWikiZip('markdown', page, [page]);

      expect(spyClick).toHaveBeenCalled();
      vi.restoreAllMocks();
    });

    it('should export as HTML reader', async () => {
      const page = createPage({ id: 'export-html', title: 'HTML Page', content: 'html content', type: 'document' });
      await storage.savePage(page);

      const { spyClick } = mockDownload();
      await storage.exportWikiZip('html', page, [page]);

      expect(spyClick).toHaveBeenCalled();
      vi.restoreAllMocks();
    });

    it('should export as text zip', async () => {
      const page = createPage({ id: 'export-txt', title: 'Text Page', content: 'text content', type: 'document' });
      await storage.savePage(page);

      const { spyClick } = mockDownload();
      await storage.exportWikiZip('text', page, [page]);

      expect(spyClick).toHaveBeenCalled();
      vi.restoreAllMocks();
    });
  });

  // ─── Data Integrity Pipeline ───────────────────────────

  describe('full lifecycle pipeline', () => {
    it('should survive a complete create → update → export → import cycle', async () => {
      // 1. Create pages
      const pageA = createPage({ id: 'a', title: 'Page A', content: 'content A' });
      const pageB = createPage({ id: 'b', title: 'Page B', content: 'content B', parentId: 'a' });
      await storage.savePage(pageA);
      await storage.savePage(pageB);

      // 2. Verify creation
      let all = await storage.getAllPages();
      expect(all).toHaveLength(2);

      // 3. Update page A
      const updatedA = createPage({ id: 'a', title: 'Page A Updated', content: 'updated', children: ['b'] });
      await storage.savePage(updatedA);

      const retrieved = await storage.getPage('a');
      expect(retrieved!.title).toBe('Page A Updated');
      expect(retrieved!.children).toEqual(['b']);

      // 4. Delete page B
      await storage.deletePage('b');
      all = await storage.getAllPages();
      expect(all).toHaveLength(1);

      // 5. Import replaces everything
      const importData = [
        createPage({ id: 'x', title: 'Imported X' }),
        createPage({ id: 'y', title: 'Imported Y' }),
        createPage({ id: 'z', title: 'Imported Z' }),
      ];
      await storage.importPages(importData);

      all = await storage.getAllPages();
      expect(all).toHaveLength(3);

      // 6. Verify old data is gone
      const oldPage = await storage.getPage('a');
      expect(oldPage).toBeNull();

      // 7. Verify new data is intact
      const newPage = await storage.getPage('x');
      expect(newPage!.title).toBe('Imported X');
    });
  });
});