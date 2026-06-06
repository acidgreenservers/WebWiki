import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PageEditor } from '../src/features/wiki/components/PageEditor';
import React from 'react';

const mockPage = {
  id: '1',
  title: 'Test Page',
  content: 'Initial content',
  createdAt: new Date(),
  updatedAt: new Date(),
  parentId: null,
  children: [],
  type: 'document' as const,
};

const mockAllPages = [mockPage];

describe('PageEditor Formatting', () => {
  it('inserts bold markers around selection', async () => {
    const onSave = vi.fn();
    render(
      <PageEditor
        page={mockPage}
        onSave={onSave}
        onSelectPage={vi.fn()}
        onCreateSubPage={vi.fn()}
        onCreateSiblingPage={vi.fn()}
        allPages={mockAllPages}
      />
    );

    const textarea = screen.getByPlaceholderText(/Start writing your wiki page content here/i) as HTMLTextAreaElement;

    // Select 'Initial'
    textarea.setSelectionRange(0, 7);

    const boldButton = screen.getByTitle('Bold');
    fireEvent.click(boldButton);

    expect(textarea.value).toContain('**Initial** content');
  });

  it('inserts external link', async () => {
    render(
      <PageEditor
        page={mockPage}
        onSave={vi.fn()}
        onSelectPage={vi.fn()}
        onCreateSubPage={vi.fn()}
        onCreateSiblingPage={vi.fn()}
        allPages={mockAllPages}
      />
    );

    const globeButton = screen.getByTitle('Insert External Link');
    fireEvent.click(globeButton);

    const titleInput = screen.getByPlaceholderText('Link Title');
    const urlInput = screen.getByPlaceholderText('URL (https://...)');
    const insertButton = screen.getByText('Insert External Link');

    fireEvent.change(titleInput, { target: { value: 'Google' } });
    fireEvent.change(urlInput, { target: { value: 'https://google.com' } });
    fireEvent.click(insertButton);

    const textarea = screen.getByPlaceholderText(/Start writing your wiki page content here/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('[Google](https://google.com)');
  });
});
