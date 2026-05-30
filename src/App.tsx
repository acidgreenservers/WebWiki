import React, { useState, useEffect } from 'react';
import { WikiPage } from '@/features/wiki/types/wiki';
import { WikiStorage } from '@/features/wiki/services/storage';
import { PageEditor } from '@/features/wiki/components/PageEditor';
import { PageList } from '@/features/wiki/components/PageList';
import { ExportPanel } from '@/features/wiki/components/ExportPanel';
import { ImportPanel } from '@/features/wiki/components/ImportPanel';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Download, Upload, Database } from 'lucide-react';

function App() {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [storage] = useState(() => new WikiStorage());

  useEffect(() => {
    const loadPages = async () => {
      const loadedPages = await storage.getAllPages();
      setPages(loadedPages);
      if (loadedPages.length > 0 && !selectedPage) {
        setSelectedPage(loadedPages[0]);
      }
    };
    loadPages();
  }, [storage, selectedPage]);

  const handleCreatePage = async () => {
    const newPage: WikiPage = {
      id: Date.now().toString(),
      title: 'New Page',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: null,
      children: [],
    };
    
    await storage.savePage(newPage);
    setPages([...pages, newPage]);
    setSelectedPage(newPage);
  };

  const handleDeletePage = async (id: string) => {
    await storage.deletePage(id);
    const updatedPages = pages.filter(page => page.id !== id);
    setPages(updatedPages);
    
    if (selectedPage?.id === id) {
      setSelectedPage(updatedPages.length > 0 ? updatedPages[0] : null);
    }
  };

  const handleSelectPage = (page: WikiPage) => {
    setSelectedPage(page);
  };

  const handleUpdatePage = async (updatedPage: WikiPage) => {
    await storage.savePage(updatedPage);
    setPages(pages.map(page => 
      page.id === updatedPage.id ? updatedPage : page
    ));
    setSelectedPage(updatedPage);
  };

  const handleImportComplete = async () => {
    const loadedPages = await storage.getAllPages();
    setPages(loadedPages);
    if (loadedPages.length > 0) {
      setSelectedPage(loadedPages[0]);
    }
    setShowImport(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background" 
         style={{ backgroundImage: 'radial-gradient(ellipse at 30% 20%, rgba(30, 50, 80, 0.6) 0%, transparent 60%)' }}>
      <header className="bg-transparent text-text-primary p-4 border-b border-border">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center">
            <BookOpen className="mr-2 text-primary" />
            <span className="font-sans font-semibold">WebWiki</span>
          </h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm bg-surface px-3 py-1 rounded-full border border-border">
              <Database className="mr-2 h-4 w-4 text-success" />
              <span>LOCAL ONLY</span>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={() => setShowImport(true)}
                variant="outline"
                className="flex items-center"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button 
                onClick={() => setShowExport(true)}
                variant="outline"
                className="flex items-center"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button 
                onClick={handleCreatePage}
                className="flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Page
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-surface border-r border-border overflow-y-auto">
          <PageList 
            pages={pages} 
            selectedPage={selectedPage}
            onSelectPage={handleSelectPage}
            onDeletePage={handleDeletePage}
          />
        </div>

        <div className="flex-1 overflow-auto bg-background">
          {selectedPage ? (
            <PageEditor 
              page={selectedPage} 
              onSave={handleUpdatePage}
              allPages={pages}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-text-secondary">
              <div className="text-center p-8 bg-surface rounded-xl border border-border max-w-md">
                <BookOpen className="mx-auto h-12 w-12 text-primary" />
                <h3 className="mt-4 text-xl font-semibold text-text-primary">No page selected</h3>
                <p className="mt-2">Create a new page or select an existing one to begin</p>
                <Button 
                  onClick={handleCreatePage}
                  className="mt-6"
                >
                  Create New Page
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showExport && (
        <ExportPanel 
          pages={pages} 
          onClose={() => setShowExport(false)} 
        />
      )}

      {showImport && (
        <ImportPanel 
          onClose={() => setShowImport(false)}
          onImportComplete={handleImportComplete}
        />
      )}
    </div>
  );
}

export default App;
