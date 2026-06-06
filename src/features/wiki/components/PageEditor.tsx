import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WikiPage } from '@/features/wiki/types/wiki';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Save, ChevronRight, Home } from 'lucide-react';
import { EditorToolbar } from './EditorToolbar';

interface PageEditorProps {
  page: WikiPage;
  onSave: (page: WikiPage) => void;
  onSelectPage: (page: WikiPage) => void;
  onCreateSubPage: (parentId: string, type?: 'document' | 'folder') => void;
  onCreateSiblingPage: (siblingId: string, type?: 'document' | 'folder') => void;
  allPages: WikiPage[];
}

export const PageEditor: React.FC<PageEditorProps> = ({
  page,
  onSave,
  onSelectPage,
  onCreateSubPage,
  onCreateSiblingPage,
  allPages
}) => {
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTitle(page.title);
    setContent(page.content);
  }, [page.id]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    const updatedPage = {
      ...page,
      title,
      content,
      updatedAt: new Date()
    };
    
    try {
      await onSave(updatedPage);
    } finally {
      setIsSaving(false);
    }
  }, [page, title, content, onSave, isSaving]);

  // Autosave logic
  useEffect(() => {
    const hasChanges = title !== page.title || content !== page.content;

    if (hasChanges && !isSaving) {
      const timer = setTimeout(() => {
        handleSave();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [title, content, page.title, page.content, page.id, isSaving, handleSave]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const insertAtCursor = (textBefore: string, textAfter: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selectedText = currentText.substring(start, end);

    const newText =
      currentText.substring(0, start) +
      textBefore +
      selectedText +
      textAfter +
      currentText.substring(end);

    setContent(newText);

    // Set focus back and adjust selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + textBefore.length + selectedText.length + textAfter.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleFormat = (command: string) => {
    switch (command) {
      case 'bold':
        insertAtCursor('**', '**');
        break;
      case 'italic':
        insertAtCursor('_', '_');
        break;
      case 'unordered-list':
        insertAtCursor('\n- ', '');
        break;
      case 'ordered-list':
        insertAtCursor('\n1. ', '');
        break;
      case 'blockquote':
        insertAtCursor('\n> ', '');
        break;
      default:
        console.log(`Unknown format command: ${command}`);
    }
  };

  const handleInsertLink = (pageId: string) => {
    const targetPage = allPages.find(p => p.id === pageId);
    if (targetPage) {
      insertAtCursor(`[${targetPage.title}](${targetPage.id})`);
    }
  };

  const handleInsertExternalLink = (title: string, url: string) => {
    insertAtCursor(`[${title}](${url})`);
  };

  const handleAddTag = (tag: string) => {
    const updatedPage = {
      ...page,
      tags: [...(page.tags || []), tag]
    };
    onSave(updatedPage);
  };

  const handleAddConnection = (pageId: string) => {
    const updatedPage = {
      ...page,
      children: [...(page.children || []), pageId]
    };
    onSave(updatedPage);
  };

  const handleAddSection = (type: string) => {
    let template = '';
    const now = new Date().toLocaleDateString();

    switch (type) {
      case 'metadata':
        template = `\n\n### METADATA\n- **Status:** Draft\n- **Created:** ${now}\n- **Author:** \n- **Type:** ${page.type}\n`;
        break;
      case 'timeline':
        template = `\n\n### TIMELINE\n- **Event 1 (${now}):** Description\n- **Event 2:** Description\n`;
        break;
      case 'people':
        template = `\n\n### PEOPLE\n- **Contact Name:** Role / Relationship\n- **Contact Name:** Role / Relationship\n`;
        break;
      case 'locations':
        template = `\n\n### LOCATIONS\n- **Location Name:** Coordinates / Description\n`;
        break;
      default:
        template = `\n\n## ${type.toUpperCase()}\n- `;
    }

    insertAtCursor(template);
  };

  const getBreadcrumbs = () => {
    const crumbs: WikiPage[] = [];
    let current: WikiPage | undefined = page;

    while (current) {
      crumbs.unshift(current);
      const pid: string | null = current.parentId;
      current = allPages.find(p => p.id === pid);
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="h-full flex flex-col">
      <div className="bg-surface border-b border-border px-4 py-2 flex items-center text-xs text-text-secondary overflow-x-auto whitespace-nowrap">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 mr-1"
          onClick={() => {
            const rootPages = allPages.filter(p => p.parentId === null);
            if (rootPages.length > 0) onSelectPage(rootPages[0]);
          }}
          title="Go to root page"
        >
          <Home className="h-3 w-3" />
        </Button>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.id}>
            {index > 0 && <ChevronRight className="h-3 w-3 mx-1 opacity-50" />}
            <button
              className={`hover:text-primary transition-colors ${index === breadcrumbs.length - 1 ? 'text-text-primary font-semibold' : ''}`}
              onClick={() => onSelectPage(crumb)}
            >
              {crumb.title}
            </button>
          </React.Fragment>
        ))}
      </div>
      <EditorToolbar 
        currentPage={page}
        allPages={allPages}
        onFormat={handleFormat}
        onInsertLink={handleInsertLink}
        onInsertExternalLink={handleInsertExternalLink}
        onAddTag={handleAddTag}
        onAddConnection={handleAddConnection}
        onAddSection={handleAddSection}
        onCreateSubPage={onCreateSubPage}
        onCreateSiblingPage={onCreateSiblingPage}
      />
      <Card className="flex-1 flex flex-col border-0 rounded-none shadow-none bg-background">
        <CardHeader className="border-b border-border bg-surface">
          <div className="flex justify-between items-center">
            <CardTitle className="flex-1">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl font-bold border-none p-0 focus:ring-0 bg-transparent text-text-primary placeholder:text-text-muted"
                placeholder="Page title"
              />
            </CardTitle>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="ml-4"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
          
          <div className="flex text-sm text-text-secondary mt-3">
            <div className="flex items-center mr-6">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Created: {formatDate(page.createdAt)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              <span>Updated: {formatDate(page.updatedAt)}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 bg-background">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full min-h-[500px] p-6 border-0 rounded-none focus:ring-0 resize-none text-lg bg-surface text-text-primary placeholder:text-text-muted"
            placeholder="Start writing your wiki page content here..."
          />
        </CardContent>
      </Card>
    </div>
  );
};
