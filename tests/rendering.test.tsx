import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownPreview } from '../src/features/wiki/components/MarkdownPreview';
import React from 'react';

describe('Markdown Rendering Consistency', () => {
  it('renders unordered lists with hyphen (-)', () => {
    const content = '- Item 1\n- Item 2';
    render(<MarkdownPreview content={content} />);

    const list = screen.getByRole('list');
    expect(list.tagName).toBe('UL');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('renders unordered lists with asterisk (*)', () => {
    const content = '* Item A\n* Item B';
    render(<MarkdownPreview content={content} />);

    const list = screen.getByRole('list');
    expect(list.tagName).toBe('UL');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Item A')).toBeInTheDocument();
  });

  it('renders ordered lists with numbers (1.)', () => {
    const content = '1. First\n2. Second';
    render(<MarkdownPreview content={content} />);

    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('First')).toBeInTheDocument();
  });

  it('renders mixed lists correctly', () => {
    const content = '- Dash item\n* Star item\n1. Number item';
    const { container } = render(<MarkdownPreview content={content} />);

    const uls = container.querySelectorAll('ul');
    const ols = container.querySelectorAll('ol');

    // In GFM, consecutive different markers for unordered lists might merge or split
    // depending on indentation and specific parser rules.
    // marked usually merges - and * into the same UL if adjacent.
    expect(uls.length).toBeGreaterThanOrEqual(1);
    expect(ols.length).toBe(1);
  });

  it('renders bold and italic correctly', () => {
    const content = '**Bold** and _Italic_';
    render(<MarkdownPreview content={content} />);

    expect(screen.getByText('Bold').tagName).toBe('STRONG');
    expect(screen.getByText('Italic').tagName).toBe('EM');
  });

  it('renders blockquotes correctly', () => {
    const content = '> Quote text';
    const { container } = render(<MarkdownPreview content={content} />);

    const blockquote = container.querySelector('blockquote');
    expect(blockquote).toBeInTheDocument();
    expect(blockquote?.textContent).toContain('Quote text');
  });
});
