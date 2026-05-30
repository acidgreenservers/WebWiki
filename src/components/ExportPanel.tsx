import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Download, X, FileText, FileCode, FileArchive } from 'lucide-react';
import { WikiStorage } from '../utils/storage';
import { WikiPage } from '../types/wiki';

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
      case 'text': return <FileText className="h-5 w-5 text-[#3b6ef8]" />;
      case 'markdown': return <FileCode className="h-5 w-5 text-[#3b6ef8]" />;
      case 'html': return <FileCode className="h-5 w-5 text-[#3b6ef8]" />;
      case 'json': return <FileCode className="h-5 w-5 text-[#3b6ef8]" />;
      default: return <FileText className="h-5 w-5 text-[#3b6ef8]" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-[#161b22] border border-[#30363d]">
        <CardHeader className="flex flex-row items-center justify-between border-b border-[#30363d]">
          <CardTitle className="flex items-center text-[#e6edf3]">
            <Download className="mr-2 h-5 w-5 text-[#3b6ef8]" />
            Export Wiki
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium text-[#e6edf3]">Export Format</Label>
              <RadioGroup 
                value={format} 
                onValueChange={(value) => setFormat(value as any)}
                className="mt-3 space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-[#30363d] bg-[#1c2128] hover:border-[#3b6ef8] hover:bg-[#161b22] transition-colors">
                  <RadioGroupItem value="text" id="text" className="border-[#30363d] text-[#3b6ef8]" />
                  <Label htmlFor="text" className="flex items-center space-x-2 text-[#e6edf3] cursor-pointer flex-1">
                    <FileText className="h-5 w-5 text-[#3b6ef8]" />
                    <span>Plain Text</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-[#30363d] bg-[#1c2128] hover:border-[#3b6ef8] hover:bg-[#161b22] transition-colors">
                  <RadioGroupItem value="markdown" id="markdown" className="border-[#30363d] text-[#3b6ef8]" />
                  <Label htmlFor="markdown" className="flex items-center space-x-2 text-[#e6edf3] cursor-pointer flex-1">
                    <FileCode className="h-5 w-5 text-[#3b6ef8]" />
                    <span>Markdown</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-[#30363d] bg-[#1c2128] hover:border-[#3b6ef8] hover:bg-[#161b22] transition-colors">
                  <RadioGroupItem value="html" id="html" className="border-[#30363d] text-[#3b6ef8]" />
                  <Label htmlFor="html" className="flex items-center space-x-2 text-[#e6edf3] cursor-pointer flex-1">
                    <FileCode className="h-5 w-5 text-[#3b6ef8]" />
                    <span>Styled HTML</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-[#30363d] bg-[#1c2128] hover:border-[#3b6ef8] hover:bg-[#161b22] transition-colors">
                  <RadioGroupItem value="json" id="json" className="border-[#30363d] text-[#3b6ef8]" />
                  <Label htmlFor="json" className="flex items-center space-x-2 text-[#e6edf3] cursor-pointer flex-1">
                    <FileArchive className="h-5 w-5 text-[#3b6ef8]" />
                    <span>WebWiki JSON</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="p-3 rounded-lg bg-[#21262d] border border-[#30363d]">
              <div className="flex items-start">
                {getFormatIcon()}
                <div className="ml-3">
                  <p className="text-sm font-medium text-[#e6edf3]">
                    {format === 'json' ? 'WebWiki JSON Format' : format.charAt(0).toUpperCase() + format.slice(1)}
                  </p>
                  <p className="text-xs text-[#8b949e] mt-1">
                    {format === 'json' 
                      ? 'Structured format for importing into WebWiki. Contains all page data and metadata.' 
                      : getFormatDescription()}
                  </p>
                  {format === 'json' && (
                    <div className="mt-2 p-2 bg-[#161b22] rounded text-xs font-mono text-[#8b949e] overflow-x-auto">
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
                className="bg-[#21262d] border-[#30363d] text-[#e6edf3] hover:border-[#484f58] hover:bg-[#21262d]"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center bg-[#3b6ef8] hover:bg-[#2d5ce8] text-white shadow-[0_4px_12px_rgba(59,110,248,0.3)]"
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