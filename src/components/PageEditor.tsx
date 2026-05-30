import React, { useState, useEffect } from 'react';
import { WikiPage } from '../types/wiki';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Calendar, Clock, Save } from 'lucide-react';

interface PageEditorProps {
  page: WikiPage;
  onSave: (page: WikiPage) => void;
}

export const PageEditor: React.FC<PageEditorProps> = ({ page, onSave }) => {
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

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col border-0 rounded-none shadow-none bg-[#0d1117]">
        <CardHeader className="border-b border-[#30363d] bg-[#161b22]">
          <div className="flex justify-between items-center">
            <CardTitle>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl font-bold border-none p-0 focus:ring-0 bg-transparent text-[#e6edf3] placeholder-[#6e7681]"
                placeholder="Page title"
              />
            </CardTitle>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center bg-[#3b6ef8] hover:bg-[#2d5ce8] text-white shadow-[0_4px_12px_rgba(59,110,248,0.3)]"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
          
          <div className="flex text-sm text-[#8b949e] mt-3">
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
        
        <CardContent className="flex-1 p-0 bg-[#0d1117]">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full min-h-[500px] p-6 border-0 rounded-none focus:ring-0 resize-none text-lg bg-[#161b22] text-[#e6edf3] placeholder-[#6e7681]"
            placeholder="Start writing your wiki page content here..."
          />
        </CardContent>
      </Card>
    </div>
  );
};