import { describe, it, expect } from 'vitest';
import { TextExporter } from '@/features/wiki/services/exporters/TextExporter';
import { MarkdownExporter } from '@/features/wiki/services/exporters/MarkdownExporter';
import { HTMLExporter } from '@/features/wiki/services/exporters/HTMLExporter';
import { WikiPage } from '@/features/wiki/types/wiki';

const createPage = (overrides: Partial<WikiPage> = {}): WikiPage => ({
  id: crypto.randomUUID(),
  title: 'Test Page',
  content: 'Test content',
  createdAt: new Date(),
  updatedAt: new Date(),
  parentId: null,
  children: [],
  type: 'document',
  ...overrides,
});

describe('TextExporter', () => {
  it('should format a page as plain text', () => {
    const page = createPage({ title: 'Hello', content: '# Welcome\nThis is **bold**.' });
    const result = TextExporter.formatPage(page);
    expect(result).toContain('Hello');
    expect(result).toContain('=====');
    expect(result).toContain('Welcome');
    expect(result).toContain('This is bold.');
    expect(result).not.toContain('# ');
    expect(result).not.toContain('**');
  });
});

describe('MarkdownExporter', () => {
  it('should format a page as markdown', () => {
    const page = createPage({ title: 'Hello', content: '# Welcome' });
    const result = MarkdownExporter.formatPage(page);
    expect(result).toBe('# Hello\n\n# Welcome');
  });

  describe('getRelativePath', () => {
    const root = createPage({ id: 'root', title: 'Root', type: 'folder' });
    const folderA = createPage({ id: 'fA', title: 'Folder A', parentId: 'root', type: 'folder' });
    const folderB = createPage({ id: 'fB', title: 'Folder B', parentId: 'root', type: 'folder' });
    const pageA1 = createPage({ id: 'pA1', title: 'Page A1', parentId: 'fA', type: 'document' });
    const pageB1 = createPage({ id: 'pB1', title: 'Page B1', parentId: 'fB', type: 'document' });
    const subset = [root, folderA, folderB, pageA1, pageB1];

    it('should resolve sibling in same folder', () => {
      const pageA2 = createPage({ id: 'pA2', title: 'Page A2', parentId: 'fA', type: 'document' });
      const path = MarkdownExporter.getRelativePath(pageA1, pageA2, [...subset, pageA2]);
      expect(path).toBe('./Page A2.md');
    });

    it('should resolve child from parent folder', () => {
      const path = MarkdownExporter.getRelativePath(folderA, pageA1, subset);
      expect(path).toBe('./Page A1.md');
    });

    it('should resolve parent index from child', () => {
      const path = MarkdownExporter.getRelativePath(pageA1, folderA, subset);
      expect(path).toBe('./index.md');
    });

    it('should resolve root from deep child', () => {
      const path = MarkdownExporter.getRelativePath(pageA1, root, subset);
      expect(path).toBe('../index.md');
    });

    it('should resolve cross-branch sibling folder', () => {
      const path = MarkdownExporter.getRelativePath(pageA1, pageB1, subset);
      expect(path).toBe('../Folder B/Page B1.md');
    });

    it('should resolve to index.md for folders', () => {
      const path = MarkdownExporter.getRelativePath(pageA1, folderB, subset);
      expect(path).toBe('../Folder B/index.md');
    });
  });
});

describe('HTMLExporter', () => {
  it('should generate a single page with metadata', () => {
    const page = createPage({ title: 'Article', content: 'Word1 Word2' });
    const result = HTMLExporter.generateSinglePage(page);
    expect(result).toContain('<title>Article - Article Writer</title>');
    expect(result).toContain('2');
    expect(result).toContain('github.com/acidgreenservers');
  });

  it('should generate a reader with JSON data', () => {
    const root = createPage({ id: 'root', title: 'My Wiki' });
    const result = HTMLExporter.generateReader(root, [root]);
    expect(result).toContain('WebWiki Reader');
    expect(result).toContain('My Wiki');
    expect(result).toContain('const pages =');
    expect(result).toContain('"id":"root"');
  });
});
