import { describe, it, expect } from 'vitest';
import { WikiPage } from '@/features/wiki/types/wiki';

describe('WikiPage type contract', () => {
  it('should satisfy the WikiPage interface with all required fields', () => {
    const page: WikiPage = {
      id: 'test-id',
      title: 'Test Title',
      content: 'Some content',
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: null,
      children: [],
    };

    expect(page.id).toBe('test-id');
    expect(page.title).toBe('Test Title');
    expect(page.content).toBe('Some content');
    expect(page.createdAt).toBeInstanceOf(Date);
    expect(page.updatedAt).toBeInstanceOf(Date);
    expect(page.parentId).toBeNull();
    expect(page.children).toEqual([]);
  });

  it('should support optional fields', () => {
    const page: WikiPage = {
      id: 'opt',
      title: 'With Options',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: 'parent-1',
      children: ['child-1', 'child-2'],
      tags: ['tag-a', 'tag-b'],
      category: 'reference',
    };

    expect(page.tags).toEqual(['tag-a', 'tag-b']);
    expect(page.category).toBe('reference');
  });

  it('should allow null parentId for root pages', () => {
    const root: WikiPage = {
      id: 'root',
      title: 'Root',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: null,
      children: ['child-1'],
    };

    expect(root.parentId).toBeNull();
  });

  it('should allow string parentId for child pages', () => {
    const child: WikiPage = {
      id: 'child',
      title: 'Child',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: 'root',
      children: [],
    };

    expect(child.parentId).toBe('root');
  });

  it('should accept empty optional fields', () => {
    const page: WikiPage = {
      id: 'minimal',
      title: 'Minimal',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: null,
      children: [],
    };

    expect(page.tags).toBeUndefined();
    expect(page.category).toBeUndefined();
  });
});

describe('WikiPage structural patterns', () => {
  it('should support tree hierarchy via parentId/children', () => {
    const root: WikiPage = {
      id: 'root',
      title: 'Root',
      content: 'Root content',
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: null,
      children: ['child-a', 'child-b'],
    };

    const childA: WikiPage = {
      id: 'child-a',
      title: 'Child A',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: 'root',
      children: ['grandchild'],
    };

    const childB: WikiPage = {
      id: 'child-b',
      title: 'Child B',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: 'root',
      children: [],
    };

    const grandchild: WikiPage = {
      id: 'grandchild',
      title: 'Grandchild',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: 'child-a',
      children: [],
    };

    // Verify parent-child relationships
    expect(root.children).toContain('child-a');
    expect(root.children).toContain('child-b');
    expect(childA.parentId).toBe('root');
    expect(childB.parentId).toBe('root');
    expect(grandchild.parentId).toBe('child-a');

    // Simulate tree lookup
    const pages = [root, childA, childB, grandchild];
    const byId = new Map(pages.map((p) => [p.id, p]));

    const childrenOfRoot = root.children.map((id) => byId.get(id)!);
    expect(childrenOfRoot).toHaveLength(2);
    expect(childrenOfRoot.map((p) => p.title).sort()).toEqual(['Child A', 'Child B']);
  });

  it('should support page type categorization via category field', () => {
    const pages: WikiPage[] = [
      { id: '1', title: 'Section', content: '', createdAt: new Date(), updatedAt: new Date(), parentId: null, children: [], category: 'section' },
      { id: '2', title: 'Heading', content: '', createdAt: new Date(), updatedAt: new Date(), parentId: null, children: [], category: 'heading' },
      { id: '3', title: 'Paragraph', content: '', createdAt: new Date(), updatedAt: new Date(), parentId: null, children: [], category: 'paragraph' },
      { id: '4', title: 'Code', content: '', createdAt: new Date(), updatedAt: new Date(), parentId: null, children: [], category: 'code' },
    ];

    const byCategory = new Map<string, WikiPage[]>();
    for (const page of pages) {
      const cat = page.category ?? 'uncategorized';
      const list = byCategory.get(cat) ?? [];
      list.push(page);
      byCategory.set(cat, list);
    }

    expect(byCategory.size).toBe(4);
    expect(byCategory.get('section')).toHaveLength(1);
    expect(byCategory.get('code')).toHaveLength(1);
  });
});