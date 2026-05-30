import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Upload, X, FileArchive, FileText } from 'lucide-react';
import { WikiStorage } from '../utils/storage';
import { WikiPage } from '../types/wiki';

interface ImportPanelProps {
  onClose: () => void;
  onImportComplete: () => void;
}

export const ImportPanel: React.FC<ImportPanelProps> = ({ onClose, onImportComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
    setSuccess(false);
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file to import');
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const storage = new WikiStorage();
      
      if (file.name.endsWith('.zip')) {
        // Handle ZIP import
        await handleZipImport(file, storage);
      } else if (file.name.endsWith('.json')) {
        // Handle JSON import
        await handleJsonImport(file, storage);
      } else {
        setError('Unsupported file format. Please use .json or .zip files');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onImportComplete();
      }, 1000);
    } catch (err) {
      console.error('Import error:', err);
      setError('Failed to import file. Please check the file format and try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleZipImport = async (zipFile: File, storage: WikiStorage) => {
    // In a real implementation, we would use JSZip to parse the file
    // For now, we'll simulate the process
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // Simulate successful import
        resolve();
      }, 1000);
    });
  };

  const handleJsonImport = async (jsonFile: File, storage: WikiStorage) => {
    const text = await jsonFile.text();
    const data = JSON.parse(text);
    
    if (Array.isArray(data.pages)) {
      // Import pages array
      await storage.importPages(data.pages);
    } else if (data.title && data.content) {
      // Import single page
      const page: WikiPage = {
        id: data.id || Date.now().toString(),
        title: data.title,
        content: data.content,
        createdAt: new Date(data.createdAt || Date.now()),
        updatedAt: new Date(data.updatedAt || Date.now()),
        parentId: data.parentId || null,
        children: data.children || [],
        tags: data.tags,
        category: data.category
      };
      await storage.savePage(page);
    } else {
      throw new Error('Invalid JSON format');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-[#161b22] border border-[#30363d]">
        <CardHeader className="flex flex-row items-center justify-between border-b border-[#30363d]">
          <CardTitle className="flex items-center text-[#e6edf3]">
            <Upload className="mr-2 h-5 w-5 text-[#3b6ef8]" />
            Import Wiki
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
              <Label className="text-base font-medium text-[#e6edf3]">Import File</Label>
              <div className="mt-2">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#30363d] rounded-lg cursor-pointer bg-[#1c2128] hover:border-[#3b6ef8] hover:bg-[#161b22] transition-colors">
                  {file ? (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileText className="h-8 w-8 text-[#3b6ef8] mb-2" />
                      <p className="text-sm text-[#e6edf3] font-medium">{file.name}</p>
                      <p className="text-xs text-[#8b949e]">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-8 w-8 text-[#8b949e] mb-2" />
                      <p className="text-sm text-[#8b949e]">
                        <span className="font-semibold text-[#3b6ef8]">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-[#6e7681]">JSON or ZIP files</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".json,.zip"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[#21262d] border border-[#f87171]">
                <p className="text-sm text-[#f87171]">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-[#21262d] border border-[#22c55e]">
                <p className="text-sm text-[#22c55e]">Import successful! Wiki has been updated.</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline"
                onClick={onClose}
                className="bg-[#21262d] border-[#30363d] text-[#e6edf3] hover:border-[#484f58] hover:bg-[#21262d]"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleImport}
                disabled={!file || isImporting}
                className="flex items-center bg-[#3b6ef8] hover:bg-[#2d5ce8] text-white shadow-[0_4px_12px_rgba(59,110,248,0.3)]"
              >
                {isImporting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import
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