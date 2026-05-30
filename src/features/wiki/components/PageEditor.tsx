import React, { useState, useEffect } from 'react';
import { WikiPage } from '@/features/wiki/types/wiki';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Save } from 'lucide-react';
import { EditorToolbar } from './EditorToolbar';

interface PageEditorProps {
  page: WikiPage;
  onSave: (page: WikiPage) => void;
  allPages: WikiPage[];
}

export const PageEditor: React.FC<PageEditorProps> = ({ page, onSave, allPages }) => {
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTitle(page.title);
    setContent(page.content);
  }, [page]);

  const handleSave = async () => {
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
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleFormat = (command: string) => {
    // Basic formatting logic simulation
    console.log(`Format: ${command}`);
  };

  const handleInsertLink = (pageId: string) => {
    const targetPage = allPages.find(p => p.id === pageId);
    if (targetPage) {
      setContent(prev => prev + ` [[${targetPage.title}]]`);
    }
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
    setContent(prev => prev + `\n\n## ${type.toUpperCase()}\n- `);
  };

  return (
    <div className="h-full flex flex-col">
      <EditorToolbar 
        currentPage={page}
        allPages={allPages}
        onFormat={handleFormat}
        onInsertLink={handleInsertLink}
        onAddTag={handleAddTag}
        onAddConnection={handleAddConnection}
        onAddSection={handleAddSection}
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
