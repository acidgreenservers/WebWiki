import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
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
  X,
  Calendar,
  Users,
  MapPin,
  Paperclip,
  FileText
} from 'lucide-react';
import { WikiPage } from '../types/wiki';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';

interface EditorToolbarProps {
  currentPage: WikiPage | null;
  allPages: WikiPage[];
  onFormat: (command: string) => void;
  onInsertLink: (pageId: string) => void;
  onAddTag: (tag: string) => void;
  onAddConnection: (pageId: string) => void;
  onAddSection: (sectionType: string) => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  currentPage,
  allPages,
  onFormat,
  onInsertLink,
  onAddTag,
  onAddConnection,
  onAddSection
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
    <div className="border-b border-[#30363d] bg-[#161b22] p-2">
      <div className="flex flex-wrap items-center gap-1">
        {/* Text formatting */}
        <div className="flex border-r border-[#30363d] pr-2 mr-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onFormat('bold')}
            className="text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onFormat('italic')}
            className="text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
        </div>

        {/* Lists */}
        <div className="flex border-r border-[#30363d] pr-2 mr-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onFormat('unordered-list')}
            className="text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onFormat('ordered-list')}
            className="text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        {/* Links */}
        <div className="relative border-r border-[#30363d] pr-2 mr-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowLinkMenu(!showLinkMenu)}
            className={`text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] ${showLinkMenu ? 'bg-[#21262d]' : ''}`}
            title="Insert Link"
          >
            <Link className="h-4 w-4" />
          </Button>
          
          {showLinkMenu && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-[#161b22] border border-[#30363d] rounded-lg shadow-lg z-10">
              <div className="p-2 border-b border-[#30363d]">
                <Input 
                  placeholder="Search pages..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#0d1117] border-[#30363d] text-[#e6edf3]"
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredPages.length > 0 ? (
                  filteredPages.map(page => (
                    <Button
                      key={page.id}
                      variant="ghost"
                      className="w-full justify-start text-left text-[#e6edf3] hover:bg-[#21262d] rounded-none"
                      onClick={() => {
                        onInsertLink(page.id);
                        setShowLinkMenu(false);
                        setSearchTerm('');
                      }}
                    >
                      <Link2 className="h-4 w-4 mr-2 text-[#3b6ef8]" />
                      {page.title}
                    </Button>
                  ))
                ) : (
                  <div className="p-3 text-center text-[#8b949e] text-sm">
                    No pages found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="relative border-r border-[#30363d] pr-2 mr-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowTagInput(!showTagInput)}
            className={`text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] ${showTagInput ? 'bg-[#21262d]' : ''}`}
            title="Add Tag"
          >
            <Tag className="h-4 w-4" />
          </Button>
          
          {showTagInput && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-[#161b22] border border-[#30363d] rounded-lg shadow-lg z-10 p-2">
              <div className="flex">
                <Input 
                  placeholder="Enter tag..." 
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] flex-1"
                />
                <Button 
                  size="sm" 
                  className="ml-2 bg-[#3b6ef8] hover:bg-[#2d5ce8]"
                  onClick={handleAddTag}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Connections */}
        <div className="relative border-r border-[#30363d] pr-2 mr-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowConnectionMenu(!showConnectionMenu)}
            className={`text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] ${showConnectionMenu ? 'bg-[#21262d]' : ''}`}
            title="Connect to Page"
          >
            <Link2 className="h-4 w-4" />
          </Button>
          
          {showConnectionMenu && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-[#161b22] border border-[#30363d] rounded-lg shadow-lg z-10">
              <div className="p-2 border-b border-[#30363d]">
                <Input 
                  placeholder="Search pages..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#0d1117] border-[#30363d] text-[#e6edf3]"
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredPages.length > 0 ? (
                  filteredPages.map(page => (
                    <Button
                      key={page.id}
                      variant="ghost"
                      className="w-full justify-start text-left text-[#e6edf3] hover:bg-[#21262d] rounded-none"
                      onClick={() => {
                        onAddConnection(page.id);
                        setShowConnectionMenu(false);
                        setSearchTerm('');
                      }}
                    >
                      <Paperclip className="h-4 w-4 mr-2 text-[#3b6ef8]" />
                      {page.title}
                    </Button>
                  ))
                ) : (
                  <div className="p-3 text-center text-[#8b949e] text-sm">
                    No pages found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Structured Sections */}
        <div className="relative">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowSectionMenu(!showSectionMenu)}
            className={`text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] ${showSectionMenu ? 'bg-[#21262d]' : ''}`}
            title="Add Structured Section"
          >
            <Plus className="h-4 w-4" />
          </Button>
          
          {showSectionMenu && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-[#161b22] border border-[#30363d] rounded-lg shadow-lg z-10">
              <Button
                variant="ghost"
                className="w-full justify-start text-left text-[#e6edf3] hover:bg-[#21262d] rounded-none"
                onClick={() => {
                  onAddSection('metadata');
                  setShowSectionMenu(false);
                }}
              >
                <Hash className="h-4 w-4 mr-2 text-[#3b6ef8]" />
                Metadata Section
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-left text-[#e6edf3] hover:bg-[#21262d] rounded-none"
                onClick={() => {
                  onAddSection('timeline');
                  setShowSectionMenu(false);
                }}
              >
                <Calendar className="h-4 w-4 mr-2 text-[#3b6ef8]" />
                Timeline Section
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-left text-[#e6edf3] hover:bg-[#21262d] rounded-none"
                onClick={() => {
                  onAddSection('people');
                  setShowSectionMenu(false);
                }}
              >
                <Users className="h-4 w-4 mr-2 text-[#3b6ef8]" />
                People Section
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-left text-[#e6edf3] hover:bg-[#21262d] rounded-none"
                onClick={() => {
                  onAddSection('locations');
                  setShowSectionMenu(false);
                }}
              >
                <MapPin className="h-4 w-4 mr-2 text-[#3b6ef8]" />
                Locations Section
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Current page tags display */}
      {currentPage && currentPage.tags && currentPage.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {currentPage.tags.map((tag, index) => (
            <span 
              key={index} 
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#3b6ef8] bg-opacity-20 text-[#3b6ef8] border border-[#3b6ef8]"
            >
              {tag}
              <button 
                onClick={() => {
                  // In a real implementation, we would remove the tag
                  console.log(`Remove tag: ${tag}`);
                }}
                className="ml-1 hover:text-[#f87171]"
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