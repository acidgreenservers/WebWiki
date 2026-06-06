import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, X, FileText, FileCode, FileArchive, ChevronDown, ChevronRight, Folder, File } from 'lucide-react';
import { WikiStorage } from '@/features/wiki/services/storage';
import { WikiPage } from '@/features/wiki/types/wiki';

interface ExportPanelProps {
  onClose: () => void;
  pages: WikiPage[];
  currentPage?: WikiPage | null;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ onClose, pages, currentPage }) => {
  const [format, setFormat] = useState<'text' | 'markdown' | 'html'>('markdown');
  const [scope, setScope] = useState<'current' | 'all'>('current');
  const [selectedRootId, setSelectedRootId] = useState<string | null>(currentPage?.id || null);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExport = async () => {
    if (!selectedRootId) return;
    setIsExporting(true);
    
    try {
      const storage = new WikiStorage();
      const rootPage = pages.find(p => p.id === selectedRootId);
      if (rootPage) {
        if (scope === 'current') {
          await storage.exportSinglePage(format, rootPage);
        } else {
          await storage.exportWikiZip(format, rootPage, pages);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatDescription = () => {
    switch (format) {
      case 'text':
        return 'Plain text format with basic formatting';
      case 'markdown':
        return 'Zipped Markdown with recursive folder structure';
      case 'html':
        return 'Single-file styled HTML Reader with embedded data';
      default:
        return '';
    }
  };

  const rootPages = pages.filter(p => !p.parentId);

  const renderPageTree = (pageId: string, level: number = 0) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return null;

    const children = pages.filter(p => p.parentId === pageId);
    const isExpanded = expandedNodes[pageId];

    return (
      <div key={pageId} className="select-none">
        <div
          className="flex items-center py-1 px-2 hover:bg-border-subtle rounded cursor-default"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {children.length > 0 ? (
            <button onClick={(e) => toggleExpand(pageId, e)} className="mr-1">
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          ) : (
            <div className="w-4 mr-1" />
          )}
          {page.type === 'folder' ? <Folder className="h-3.5 w-3.5 mr-2 text-primary" /> : <File className="h-3.5 w-3.5 mr-2 text-text-secondary" />}
          <span className="text-xs text-text-primary">{page.title}</span>
        </div>
        {isExpanded && children.map(child => renderPageTree(child.id, level + 1))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-surface border border-border">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border">
          <CardTitle className="flex items-center text-text-primary">
            <Download className="mr-2 h-5 w-5 text-primary" />
            Export Wiki
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium text-text-primary">Export Scope</Label>
              <RadioGroup
                value={scope}
                onValueChange={(value) => {
                  setScope(value as any);
                  if (value === 'current' && currentPage) {
                    setSelectedRootId(currentPage.id);
                  } else {
                    setSelectedRootId(null);
                  }
                }}
                className="mt-3 grid grid-cols-2 gap-3"
              >
                <Label
                  className={`flex items-center justify-center space-x-2 p-3 rounded-lg border transition-colors cursor-pointer ${scope === 'current' ? 'border-primary bg-surface' : 'border-border bg-elevated hover:border-primary/50'}`}
                >
                  <RadioGroupItem value="current" id="current" className="border-border text-primary" />
                  <span className="text-xs">Current Page</span>
                </Label>
                <Label
                  className={`flex items-center justify-center space-x-2 p-3 rounded-lg border transition-colors cursor-pointer ${scope === 'all' ? 'border-primary bg-surface' : 'border-border bg-elevated hover:border-primary/50'}`}
                >
                  <RadioGroupItem value="all" id="all" className="border-border text-primary" />
                  <span className="text-xs">Recursive Wiki</span>
                </Label>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base font-medium text-text-primary">Export Format</Label>
              <RadioGroup 
                value={format} 
                onValueChange={(value) => {
                  setFormat(value as any);
                  setSelectedRootId(null);
                }}
                className="mt-3 space-y-3"
              >
                <Label
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${format === 'markdown' ? 'border-primary bg-surface' : 'border-border bg-elevated hover:border-primary/50'}`}
                >
                  <RadioGroupItem value="markdown" id="markdown" className="border-border text-primary" />
                  <div className="flex items-center space-x-2 text-text-primary flex-1">
                    <FileCode className="h-5 w-5 text-primary" />
                    <span>Zipped Markdown</span>
                  </div>
                </Label>
                
                <Label
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${format === 'html' ? 'border-primary bg-surface' : 'border-border bg-elevated hover:border-primary/50'}`}
                >
                  <RadioGroupItem value="html" id="html" className="border-border text-primary" />
                  <div className="flex items-center space-x-2 text-text-primary flex-1">
                    <FileArchive className="h-5 w-5 text-primary" />
                    <span>Single-file HTML Reader</span>
                  </div>
                </Label>

                <Label
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${format === 'text' ? 'border-primary bg-surface' : 'border-border bg-elevated hover:border-primary/50'}`}
                >
                  <RadioGroupItem value="text" id="text" className="border-border text-primary" />
                  <div className="flex items-center space-x-2 text-text-primary flex-1">
                    <FileText className="h-5 w-5 text-primary" />
                    <span>Plain Text Bundle</span>
                  </div>
                </Label>
              </RadioGroup>
            </div>

            {format && scope === 'all' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-base font-medium text-text-primary">Select Entry Point</Label>
                <p className="text-xs text-text-secondary mb-3 italic">{getFormatDescription()}</p>

                <div className="mt-2 border border-border rounded-lg overflow-hidden bg-elevated max-h-48 overflow-y-auto">
                  {rootPages.map(rootPage => (
                    <div key={rootPage.id} className="border-b border-border last:border-0">
                      <div
                        className={`flex items-center p-3 cursor-pointer transition-colors ${selectedRootId === rootPage.id ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-surface border-l-4 border-transparent'}`}
                        onClick={() => setSelectedRootId(rootPage.id)}
                      >
                        <div className="flex-1 flex items-center">
                          {rootPage.type === 'folder' ? <Folder className="h-4 w-4 mr-2 text-primary" /> : <File className="h-4 w-4 mr-2 text-text-secondary" />}
                          <span className="font-medium text-sm text-text-primary">{rootPage.title}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => toggleExpand(rootPage.id, e)}
                        >
                          {expandedNodes[rootPage.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </div>
                      {expandedNodes[rootPage.id] && (
                        <div className="bg-background/50 py-1 border-t border-border/50">
                          {pages.filter(p => p.parentId === rootPage.id).map(child => renderPageTree(child.id, 1))}
                          {pages.filter(p => p.parentId === rootPage.id).length === 0 && (
                            <div className="px-8 py-1 text-[10px] text-text-muted italic">No sub-pages</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {rootPages.length === 0 && (
                    <div className="p-4 text-center text-text-secondary text-sm italic">No entries available</div>
                  )}
                </div>
              </div>
            )}

            {scope === 'current' && (
              <div className="p-3 rounded-lg bg-border-subtle border border-border">
                <p className="text-xs text-text-secondary italic">
                  Exporting {currentPage?.title || 'selected page'} as {format.toUpperCase()}
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <Button 
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleExport}
                disabled={isExporting || !selectedRootId}
                className="flex items-center min-w-[100px]"
              >
                {isExporting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
