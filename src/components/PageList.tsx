import React from 'react';
import { WikiPage } from '../types/wiki';
import { Button } from '../../components/ui/button';
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
      <h2 className="font-semibold text-[#8b949e] px-2 py-3 border-b border-[#30363d] uppercase text-xs tracking-wider">
        Pages ({pages.length})
      </h2>
      <div className="mt-2">
        {pages.length === 0 ? (
          <p className="text-[#6e7681] text-sm p-4 text-center italic">No pages yet</p>
        ) : (
          pages.map(page => (
            <div 
              key={page.id}
              className={`flex items-center justify-between p-3 rounded mb-1 cursor-pointer hover:bg-[#21262d] border-l-2 ${
                selectedPage?.id === page.id 
                  ? 'bg-[#21262d] border-[#3b6ef8]' 
                  : 'border-transparent'
              }`}
              onClick={() => onSelectPage(page)}
            >
              <div className="flex items-center truncate">
                <FileText className="h-4 w-4 text-[#8b949e] mr-2 flex-shrink-0" />
                <span className="truncate text-[#e6edf3]">{page.title}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-[#8b949e] hover:text-[#f87171] hover:bg-[#21262d]"
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