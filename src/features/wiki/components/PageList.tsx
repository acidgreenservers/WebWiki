import React, { useState } from 'react';
import { WikiPage } from '@/features/wiki/types/wiki';
import { Button } from '@/components/ui/button';
import { Trash2, FileText, ChevronRight, ChevronDown, Plus, PlusSquare } from 'lucide-react';

interface PageListProps {
  pages: WikiPage[];
  selectedPage: WikiPage | null;
  onSelectPage: (page: WikiPage) => void;
  onDeletePage: (id: string) => void;
  onCreateSubPage: (parentId: string) => void;
  onCreateSiblingPage: (siblingId: string) => void;
  onMovePage: (pageId: string, newParentId: string | null) => void;
}

export const PageList: React.FC<PageListProps> = ({
  pages,
  selectedPage,
  onSelectPage,
  onDeletePage,
  onCreateSubPage,
  onCreateSiblingPage,
  onMovePage
}) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderTree = (parentId: string | null = null, level: number = 0, prefix: string = '') => {
    const children = pages.filter(p => p.parentId === parentId);

    return children.map((page, index) => {
      const isLast = index === children.length - 1;
      const isCollapsed = collapsed[page.id];
      const hasChildren = pages.some(p => p.parentId === page.id);

      // ASCII/Unicode tree characters
      // ├─ (Horizontal with branch)
      // └─ (Corner/Last item)
      // │  (Vertical bar)

      const connector = level === 0 ? '' : (isLast ? '└─ ' : '├─ ');

      return (
        <div key={page.id} className="select-none">
          <div
            className={`group flex items-center justify-between p-2 rounded mb-1 cursor-pointer hover:bg-border-subtle border-l-2 transition-colors ${
              selectedPage?.id === page.id
                ? 'bg-border-subtle border-primary'
                : 'border-transparent'
            }`}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => onSelectPage(page)}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('pageId', page.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              e.currentTarget.classList.add('bg-primary/10');
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('bg-primary/10');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('bg-primary/10');
              const draggedId = e.dataTransfer.getData('pageId');
              if (draggedId && draggedId !== page.id) {
                onMovePage(draggedId, page.id);
              }
            }}
          >
            <div className="flex items-center truncate flex-1">
              <span className="font-mono text-text-muted mr-1 opacity-50">{connector}</span>
              {hasChildren ? (
                <button
                  onClick={(e) => toggleCollapse(page.id, e)}
                  className="p-0.5 hover:bg-border rounded mr-1"
                >
                  {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              ) : (
                <div className="w-4 mr-1" />
              )}
              <FileText className="h-4 w-4 text-text-secondary mr-2 flex-shrink-0" />
              <span className="truncate text-text-primary text-sm">{page.title}</span>
            </div>

            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateSiblingPage(page.id);
                }}
                title="Create Sibling Page"
              >
                <PlusSquare className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:text-primary ml-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateSubPage(page.id);
                }}
                title="Create Sub-page"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:text-red-danger ml-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePage(page.id);
                }}
                title="Delete Page"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {!isCollapsed && (
            <div className="relative">
               {/* Vertical line for the tree if not last */}
               {!isLast && level > 0 && (
                 <div
                   className="absolute left-0 top-0 bottom-0 border-l border-border opacity-30"
                   style={{ left: `${level * 12 + 12}px` }}
                 />
               )}
               {renderTree(page.id, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="p-3">
      <h2 className="font-semibold text-text-secondary px-2 py-3 border-b border-border uppercase text-xs tracking-wider flex justify-between items-center">
        <span>Pages ({pages.length})</span>
      </h2>
      <div
        className="mt-2 min-h-[50px]"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={(e) => {
          e.preventDefault();
          const draggedId = e.dataTransfer.getData('pageId');
          // If dropped on the list container but not on a specific page, move to root
          if (draggedId && e.target === e.currentTarget) {
            onMovePage(draggedId, null);
          }
        }}
      >
        {pages.length === 0 ? (
          <p className="text-text-muted text-sm p-4 text-center italic">No pages yet</p>
        ) : (
          renderTree(null)
        )}
      </div>
    </div>
  );
};
