import React from 'react';
import { WikiPage } from '@/features/wiki/types/wiki';
import { Button } from '@/components/ui/button';
import { Trash2, FileText } from 'lucide-react';

interface PageListProps {
  pages: WikiPage[];
  selectedPage: WikiPage | null;
  onSelectPage: (page: WikiPage) => void;
  onDeletePage: (id: string) => void;
}

export const PageList: React.FC<PageListProps> = ({
  pages,
  selectedPage,
  onSelectPage,
  onDeletePage
}) => {
  return (
    <div className="p-3">
      <h2 className="font-semibold text-text-secondary px-2 py-3 border-b border-border uppercase text-xs tracking-wider">
        Pages ({pages.length})
      </h2>
      <div className="mt-2">
        {pages.length === 0 ? (
          <p className="text-text-muted text-sm p-4 text-center italic">No pages yet</p>
        ) : (
          pages.map(page => (
            <div 
              key={page.id}
              className={`flex items-center justify-between p-3 rounded mb-1 cursor-pointer hover:bg-border-subtle border-l-2 ${
                selectedPage?.id === page.id 
                  ? 'bg-border-subtle border-primary' 
                  : 'border-transparent'
              }`}
              onClick={() => onSelectPage(page)}
            >
              <div className="flex items-center truncate">
                <FileText className="h-4 w-4 text-text-secondary mr-2 flex-shrink-0" />
                <span className="truncate text-text-primary">{page.title}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:text-red-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePage(page.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
