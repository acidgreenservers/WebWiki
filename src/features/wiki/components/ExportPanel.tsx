import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, X, FileText, FileCode, FileArchive } from 'lucide-react';
import { WikiStorage } from '@/features/wiki/services/storage';
import { WikiPage } from '@/features/wiki/types/wiki';

interface ExportPanelProps {
  onClose: () => void;
  pages: WikiPage[];
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ onClose, pages }) => {
  const [format, setFormat] = useState<'text' | 'markdown' | 'html' | 'json'>('text');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const storage = new WikiStorage();
      await storage.exportPages(format, pages);
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
        return 'Markdown format with headers and lists';
      case 'html':
        return 'Styled HTML document with CSS';
      case 'json':
        return 'Structured JSON data for import (compatible with WebWiki)';
      default:
        return '';
    }
  };

  const getFormatIcon = () => {
    switch (format) {
      case 'text': return <FileText className="h-5 w-5 text-primary" />;
      case 'markdown': return <FileCode className="h-5 w-5 text-primary" />;
      case 'html': return <FileCode className="h-5 w-5 text-primary" />;
      case 'json': return <FileCode className="h-5 w-5 text-primary" />;
      default: return <FileText className="h-5 w-5 text-primary" />;
    }
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
              <Label className="text-base font-medium text-text-primary">Export Format</Label>
              <RadioGroup 
                value={format} 
                onValueChange={(value) => setFormat(value as any)}
                className="mt-3 space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-elevated hover:border-primary hover:bg-surface transition-colors">
                  <RadioGroupItem value="text" id="text" className="border-border text-primary" />
                  <Label htmlFor="text" className="flex items-center space-x-2 text-text-primary cursor-pointer flex-1">
                    <FileText className="h-5 w-5 text-primary" />
                    <span>Plain Text</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-elevated hover:border-primary hover:bg-surface transition-colors">
                  <RadioGroupItem value="markdown" id="markdown" className="border-border text-primary" />
                  <Label htmlFor="markdown" className="flex items-center space-x-2 text-text-primary cursor-pointer flex-1">
                    <FileCode className="h-5 w-5 text-primary" />
                    <span>Markdown</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-elevated hover:border-primary hover:bg-surface transition-colors">
                  <RadioGroupItem value="html" id="html" className="border-border text-primary" />
                  <Label htmlFor="html" className="flex items-center space-x-2 text-text-primary cursor-pointer flex-1">
                    <FileCode className="h-5 w-5 text-primary" />
                    <span>Styled HTML</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-elevated hover:border-primary hover:bg-surface transition-colors">
                  <RadioGroupItem value="json" id="json" className="border-border text-primary" />
                  <Label htmlFor="json" className="flex items-center space-x-2 text-text-primary cursor-pointer flex-1">
                    <FileArchive className="h-5 w-5 text-primary" />
                    <span>WebWiki JSON</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="p-3 rounded-lg bg-border-subtle border border-border">
              <div className="flex items-start">
                {getFormatIcon()}
                <div className="ml-3">
                  <p className="text-sm font-medium text-text-primary">
                    {format === 'json' ? 'WebWiki JSON Format' : format.charAt(0).toUpperCase() + format.slice(1)}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    {format === 'json' 
                      ? 'Structured format for importing into WebWiki. Contains all page data and metadata.' 
                      : getFormatDescription()}
                  </p>
                  {format === 'json' && (
                    <div className="mt-2 p-2 bg-surface rounded text-xs font-mono text-text-secondary overflow-x-auto">
                      {`{ "version": "1.0", "pages": [ ... ] }`}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center"
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
