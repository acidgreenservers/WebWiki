import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Link, 
  Hash, 
  Tag, 
  Link2, 
  Plus, 
  PlusSquare,
  X,
  Calendar,
  Users,
  MapPin,
  Paperclip
} from 'lucide-react';
import { WikiPage } from '@/features/wiki/types/wiki';
import { Input } from '@/components/ui/input';

interface EditorToolbarProps {
  currentPage: WikiPage | null;
  allPages: WikiPage[];
  onFormat: (command: string) => void;
  onInsertLink: (pageId: string) => void;
  onAddTag: (tag: string) => void;
  onAddConnection: (pageId: string) => void;
  onAddSection: (sectionType: string) => void;
  onCreateSubPage?: (parentId: string) => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  currentPage,
  allPages,
  onFormat,
  onInsertLink,
  onAddTag,
  onAddConnection,
  onAddSection,
  onCreateSubPage
}) => {
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [showConnectionMenu, setShowConnectionMenu] = useState(false);
  const [showSectionMenu, setShowSectionMenu] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPages = allPages.filter(page => 
    page.id !== currentPage?.id && 
    page.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTag = () => {
    if (tagInput.trim() && currentPage) {
      onAddTag(tagInput.trim());
      setTagInput('');
      setShowTagInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  return (
    <div className="border-b border-border bg-surface p-2">
      <div className="flex flex-wrap items-center gap-1">
        {/* Text formatting */}
        <div className="flex border-r border-border pr-2 mr-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onFormat('bold')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onFormat('italic')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
        </div>

        {/* Lists */}
        <div className="flex border-r border-border pr-2 mr-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onFormat('unordered-list')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onFormat('ordered-list')}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        {/* Links */}
        <div className="relative border-r border-border pr-2 mr-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowLinkMenu(!showLinkMenu)}
            className={showLinkMenu ? 'bg-border-subtle' : ''}
            title="Insert Link"
          >
            <Link className="h-4 w-4" />
          </Button>
          
          {showLinkMenu && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-surface border border-border rounded-lg shadow-lg z-10">
              <div className="p-2 border-b border-border">
                <Input 
                  placeholder="Search pages..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredPages.length > 0 ? (
                  filteredPages.map(page => (
                    <Button
                      key={page.id}
                      variant="ghost"
                      className="w-full justify-start text-left rounded-none"
                      onClick={() => {
                        onInsertLink(page.id);
                        setShowLinkMenu(false);
                        setSearchTerm('');
                      }}
                    >
                      <Link2 className="h-4 w-4 mr-2 text-primary" />
                      {page.title}
                    </Button>
                  ))
                ) : (
                  <div className="p-3 text-center text-text-secondary text-sm">
                    No pages found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="relative border-r border-border pr-2 mr-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowTagInput(!showTagInput)}
            className={showTagInput ? 'bg-border-subtle' : ''}
            title="Add Tag"
          >
            <Tag className="h-4 w-4" />
          </Button>
          
          {showTagInput && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-surface border border-border rounded-lg shadow-lg z-10 p-2">
              <div className="flex">
                <Input 
                  placeholder="Enter tag..." 
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-background border-border flex-1"
                />
                <Button 
                  size="sm" 
                  className="ml-2"
                  onClick={handleAddTag}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Connections */}
        <div className="relative border-r border-border pr-2 mr-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowConnectionMenu(!showConnectionMenu)}
            className={showConnectionMenu ? 'bg-border-subtle' : ''}
            title="Connect to Page"
          >
            <Link2 className="h-4 w-4" />
          </Button>
          
          {showConnectionMenu && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-surface border border-border rounded-lg shadow-lg z-10">
              <div className="p-2 border-b border-border">
                <Input 
                  placeholder="Search pages..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredPages.length > 0 ? (
                  filteredPages.map(page => (
                    <Button
                      key={page.id}
                      variant="ghost"
                      className="w-full justify-start text-left rounded-none"
                      onClick={() => {
                        onAddConnection(page.id);
                        setShowConnectionMenu(false);
                        setSearchTerm('');
                      }}
                    >
                      <Paperclip className="h-4 w-4 mr-2 text-primary" />
                      {page.title}
                    </Button>
                  ))
                ) : (
                  <div className="p-3 text-center text-text-secondary text-sm">
                    No pages found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Structured Sections */}
        <div className="relative border-r border-border pr-2 mr-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowSectionMenu(!showSectionMenu)}
            className={showSectionMenu ? 'bg-border-subtle' : ''}
            title="Add Structured Section"
          >
            <Plus className="h-4 w-4" />
          </Button>
          
          {showSectionMenu && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-surface border border-border rounded-lg shadow-lg z-10">
              <Button
                variant="ghost"
                className="w-full justify-start text-left rounded-none"
                onClick={() => {
                  onAddSection('metadata');
                  setShowSectionMenu(false);
                }}
              >
                <Hash className="h-4 w-4 mr-2 text-primary" />
                Metadata Section
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-left rounded-none"
                onClick={() => {
                  onAddSection('timeline');
                  setShowSectionMenu(false);
                }}
              >
                <Calendar className="h-4 w-4 mr-2 text-primary" />
                Timeline Section
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-left rounded-none"
                onClick={() => {
                  onAddSection('people');
                  setShowSectionMenu(false);
                }}
              >
                <Users className="h-4 w-4 mr-2 text-primary" />
                People Section
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-left rounded-none"
                onClick={() => {
                  onAddSection('locations');
                  setShowSectionMenu(false);
                }}
              >
                <MapPin className="h-4 w-4 mr-2 text-primary" />
                Locations Section
              </Button>
            </div>
          )}
        </div>

        {/* Create Sub-page */}
        {onCreateSubPage && currentPage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCreateSubPage(currentPage.id)}
            title="Create Sub-page"
            className="text-primary hover:bg-primary/10"
          >
            <PlusSquare className="h-4 w-4 mr-2" />
            <span className="text-xs font-semibold">New Sub-page</span>
          </Button>
        )}
      </div>

      {/* Current page tags display */}
      {currentPage && currentPage.tags && currentPage.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {currentPage.tags.map((tag, index) => (
            <span 
              key={index} 
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary bg-opacity-20 text-primary border border-primary"
            >
              {tag}
              <button 
                onClick={() => {
                  console.log(`Remove tag: ${tag}`);
                }}
                className="ml-1 hover:text-red-danger"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
