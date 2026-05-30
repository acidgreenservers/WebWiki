import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, X, FileText } from 'lucide-react';
import { WikiStorage } from '@/features/wiki/services/storage';
import { WikiPage } from '@/features/wiki/types/wiki';

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
      
      if (file.name.endsWith('.json')) {
        // Handle JSON import
        await handleJsonImport(file, storage);
      } else {
        setError('Unsupported file format. Please use .json files');
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
      <Card className="w-full max-w-md bg-surface border border-border">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border">
          <CardTitle className="flex items-center text-text-primary">
            <Upload className="mr-2 h-5 w-5 text-primary" />
            Import Wiki
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
              <Label className="text-base font-medium text-text-primary">Import File</Label>
              <div className="mt-2">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-elevated hover:border-primary hover:bg-surface transition-colors">
                  {file ? (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileText className="h-8 w-8 text-primary mb-2" />
                      <p className="text-sm text-text-primary font-medium">{file.name}</p>
                      <p className="text-xs text-text-secondary">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-8 w-8 text-text-secondary mb-2" />
                      <p className="text-sm text-text-secondary">
                        <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-text-muted">JSON files</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".json"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-border-subtle border border-red-danger">
                <p className="text-sm text-red-danger">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-border-subtle border border-success">
                <p className="text-sm text-success">Import successful! Wiki has been updated.</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleImport}
                disabled={!file || isImporting}
                className="flex items-center"
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
