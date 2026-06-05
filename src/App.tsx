import React, { useState, useEffect } from 'react';
import { WikiPage } from '@/features/wiki/types/wiki';
import { WikiStorage } from '@/features/wiki/services/storage';
import { PageEditor } from '@/features/wiki/components/PageEditor';
import { PageList } from '@/features/wiki/components/PageList';
import { ExportPanel } from '@/features/wiki/components/ExportPanel';
import { ImportPanel } from '@/features/wiki/components/ImportPanel';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Download, Upload, Database, Menu, X, PlusSquare, FolderPlus, FilePlus } from 'lucide-react';
import { DeleteConfirmationModal } from '@/features/wiki/components/DeleteConfirmationModal';

function App() {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [storage] = useState(() => new WikiStorage());

  // Mobile UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showMobileCreateMenu, setShowMobileCreateMenu] = useState(false);

  // Deletion state
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    pageId: string | null;
    step: 1 | 2;
  }>({ isOpen: false, pageId: null, step: 1 });

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

  const handleCreatePage = async (parentId: string | null = null, siblingId: string | null = null, type: 'document' | 'folder' = 'document') => {
    const newPage: WikiPage = {
      id: Date.now().toString(),
      title: type === 'folder' ? 'New Folder' : (parentId ? 'New Sub-page' : (siblingId ? 'New Sibling' : 'New Page')),
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: parentId,
      children: [],
      type: type,
    };
    
    await storage.savePage(newPage);

    if (parentId) {
      const parentPage = pages.find(p => p.id === parentId);
      if (parentPage) {
        const updatedParent = {
          ...parentPage,
          children: [...(parentPage.children || []), newPage.id],
          updatedAt: new Date()
        };
        await storage.savePage(updatedParent);
        setPages(prev => prev.map(p => p.id === parentId ? updatedParent : p).concat(newPage));
      } else {
        setPages(prev => [...prev, newPage]);
      }
    } else if (siblingId) {
      // Find where to insert the new page (after the sibling)
      const sibling = pages.find(p => p.id === siblingId);
      const actualParentId = sibling?.parentId || null;

      // Update the new page with the sibling's parent
      newPage.parentId = actualParentId;
      newPage.title = 'New Sibling';
      await storage.savePage(newPage);

      if (actualParentId) {
        const parent = pages.find(p => p.id === actualParentId);
        if (parent) {
          const siblingIndex = (parent.children || []).indexOf(siblingId);
          const newChildren = [...(parent.children || [])];
          newChildren.splice(siblingIndex + 1, 0, newPage.id);

          const updatedParent = {
            ...parent,
            children: newChildren,
            updatedAt: new Date()
          };
          await storage.savePage(updatedParent);
          setPages(prev => prev.map(p => p.id === actualParentId ? updatedParent : p).concat(newPage));
        } else {
          setPages(prev => [...prev, newPage]);
        }
      } else {
        setPages(prev => [...prev, newPage]);
      }
    } else {
      setPages(prev => [...prev, newPage]);
    }

    setSelectedPage(newPage);
  };

  const handleCreateSiblingPage = async (siblingId: string, type: 'document' | 'folder' = 'document') => {
    const sibling = pages.find(p => p.id === siblingId);
    if (!sibling) return;
    await handleCreatePage(null, siblingId, type);
  };

  const getRecursiveIds = (id: string, allPages: WikiPage[]): string[] => {
    const page = allPages.find(p => p.id === id);
    if (!page) return [];

    let ids = [id];
    const children = allPages.filter(p => p.parentId === id);
    for (const child of children) {
      ids = [...ids, ...getRecursiveIds(child.id, allPages)];
    }
    return ids;
  };

  const handleDeletePage = async (id: string) => {
    const pageToDelete = pages.find(p => p.id === id);
    if (!pageToDelete) return;

    const hasChildren = pages.some(p => p.parentId === id);

    if (hasChildren) {
      setDeleteDialog({ isOpen: true, pageId: id, step: 1 });
    } else {
      // Simple deletion for pages without children (single confirmation)
      setDeleteDialog({ isOpen: true, pageId: id, step: 2 });
    }
  };

  const confirmDelete = async () => {
    const id = deleteDialog.pageId;
    if (!id) return;

    const pageToDelete = pages.find(p => p.id === id);
    if (!pageToDelete) return;

    const hasChildren = pages.some(p => p.parentId === id);

    if (hasChildren && deleteDialog.step === 1) {
      setDeleteDialog({ ...deleteDialog, step: 2 });
      return;
    }

    // Final confirmation step
    const idsToDelete = getRecursiveIds(id, pages);

    for (const deleteId of idsToDelete) {
      await storage.deletePage(deleteId);
    }

    // Update parent if exists
    let updatedPages = pages.filter(p => !idsToDelete.includes(p.id));
    if (pageToDelete.parentId) {
      const parent = updatedPages.find(p => p.id === pageToDelete.parentId);
      if (parent) {
        const updatedParent = {
          ...parent,
          children: (parent.children || []).filter(childId => childId !== id),
          updatedAt: new Date()
        };
        await storage.savePage(updatedParent);
        updatedPages = updatedPages.map(p => p.id === parent.id ? updatedParent : p);
      }
    }

    setPages(updatedPages);
    
    if (selectedPage && idsToDelete.includes(selectedPage.id)) {
      setSelectedPage(updatedPages.length > 0 ? updatedPages[0] : null);
    }

    setDeleteDialog({ isOpen: false, pageId: null, step: 1 });
  };

  const handleMovePage = async (pageId: string, newParentId: string | null) => {
    const page = pages.find(p => p.id === pageId);
    if (!page || page.parentId === newParentId) return;

    // Prevent moving a page into one of its own descendants
    const descendantIds = getRecursiveIds(pageId, pages);
    if (newParentId && descendantIds.includes(newParentId)) {
      console.error("Cannot move a page into its own descendant");
      return;
    }

    let updatedPages = [...pages];

    // 1. Remove from old parent
    if (page.parentId) {
      const oldParent = updatedPages.find(p => p.id === page.parentId);
      if (oldParent) {
        const updatedOldParent = {
          ...oldParent,
          children: (oldParent.children || []).filter(id => id !== pageId),
          updatedAt: new Date()
        };
        await storage.savePage(updatedOldParent);
        updatedPages = updatedPages.map(p => p.id === oldParent.id ? updatedOldParent : p);
      }
    }

    // 2. Update the page itself
    const updatedPage = {
      ...page,
      parentId: newParentId,
      updatedAt: new Date()
    };
    await storage.savePage(updatedPage);
    updatedPages = updatedPages.map(p => p.id === pageId ? updatedPage : p);

    // 3. Add to new parent
    if (newParentId) {
      const newParent = updatedPages.find(p => p.id === newParentId);
      if (newParent) {
        const updatedNewParent = {
          ...newParent,
          children: [...(newParent.children || []), pageId],
          updatedAt: new Date()
        };
        await storage.savePage(updatedNewParent);
        updatedPages = updatedPages.map(p => p.id === newParentId ? updatedNewParent : p);
      }
    }

    setPages(updatedPages);
    if (selectedPage?.id === pageId) {
      setSelectedPage(updatedPage);
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
      <header className="bg-transparent text-text-primary p-4 border-b border-border z-30">
        <div className="w-full px-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="mr-2 md:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            <h1 className="text-2xl font-bold flex items-center">
              <BookOpen className="mr-2 text-primary" />
              <span className="font-sans font-semibold">WebWiki</span>
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center text-sm bg-surface px-3 py-1 rounded-full border border-border">
              <Database className="mr-2 h-4 w-4 text-success" />
              <span>LOCAL ONLY</span>
            </div>
            <div className="hidden lg:flex space-x-2">
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
                onClick={() => handleCreatePage(null, null, 'document')}
                variant="outline"
                className="flex items-center"
              >
                <FilePlus className="mr-2 h-4 w-4" />
                New Page
              </Button>
              <Button
                onClick={() => handleCreatePage(null, null, 'folder')}
                className="flex items-center"
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                New Folder
              </Button>
            </div>

            <div className="hidden md:flex lg:hidden space-x-2">
               <Button
                onClick={() => setShowExport(true)}
                variant="outline"
                size="sm"
                title="Export"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => handleCreatePage(null, null, 'document')}
                variant="outline"
                size="sm"
                title="New Page"
              >
                <FilePlus className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => handleCreatePage(null, null, 'folder')}
                size="sm"
                title="New Folder"
              >
                <FolderPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 w-64 bg-surface border-r border-border overflow-y-auto z-50 transition-transform duration-300 md:relative md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <PageList 
            pages={pages} 
            selectedPage={selectedPage}
            onSelectPage={(page) => {
              handleSelectPage(page);
              setIsSidebarOpen(false);
            }}
            onDeletePage={handleDeletePage}
            onCreateSubPage={handleCreatePage}
            onCreateSiblingPage={handleCreateSiblingPage}
            onCreateRootPage={(type) => handleCreatePage(null, null, type)}
            onMovePage={handleMovePage}
          />
        </div>

        <div className="flex-1 overflow-auto bg-background pb-20 md:pb-0">
          {selectedPage ? (
            <PageEditor 
              page={selectedPage} 
              onSave={handleUpdatePage}
              onSelectPage={handleSelectPage}
              onCreateSubPage={handleCreatePage}
              onCreateSiblingPage={handleCreateSiblingPage}
              allPages={pages}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-text-secondary">
              <div className="text-center p-8 bg-surface rounded-xl border border-border max-w-md">
                <BookOpen className="mx-auto h-12 w-12 text-primary" />
                <h3 className="mt-4 text-xl font-semibold text-text-primary">No page selected</h3>
                <p className="mt-2">Create a new page or select an existing one to begin</p>
                <div className="flex gap-2 justify-center mt-6">
                  <Button
                    onClick={() => handleCreatePage(null, null, 'document')}
                    variant="outline"
                  >
                    <FilePlus className="mr-2 h-4 w-4" />
                    New Page
                  </Button>
                  <Button
                    onClick={() => handleCreatePage(null, null, 'folder')}
                  >
                    <FolderPlus className="mr-2 h-4 w-4" />
                    New Folder
                  </Button>
                </div>
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

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border flex items-center justify-around z-40 px-4">
        <Button
          variant="ghost"
          className="flex flex-col items-center gap-1 text-text-secondary hover:text-primary"
          onClick={() => setShowImport(true)}
        >
          <Upload className="h-5 w-5" />
          <span className="text-[10px] uppercase font-bold tracking-tighter">Import</span>
        </Button>

        <div className="relative">
          {showMobileCreateMenu && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col gap-2 w-48 animate-in fade-in slide-in-from-bottom-4 duration-200">
              {selectedPage && (
                <Button
                  onClick={() => {
                    handleCreateSiblingPage(selectedPage.id);
                    setShowMobileCreateMenu(false);
                  }}
                  className="bg-primary hover:bg-primary-hover text-white shadow-lg"
                >
                  <PlusSquare className="h-4 w-4 mr-2" />
                  New Sibling
                </Button>
              )}
              <Button
                onClick={() => {
                  handleCreatePage(selectedPage?.id || null, null, 'document');
                  setShowMobileCreateMenu(false);
                }}
                className="bg-primary hover:bg-primary-hover text-white shadow-lg"
              >
                <FilePlus className="h-4 w-4 mr-2" />
                New Sub-page
              </Button>
              <Button
                onClick={() => {
                  handleCreatePage(selectedPage?.id || null, null, 'folder');
                  setShowMobileCreateMenu(false);
                }}
                className="bg-primary hover:bg-primary-hover text-white shadow-lg"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
              <Button
                onClick={() => {
                  handleCreatePage(null, null, 'document');
                  setShowMobileCreateMenu(false);
                }}
                className="bg-elevated hover:bg-border border border-border text-text-primary shadow-lg"
              >
                <FilePlus className="h-4 w-4 mr-2" />
                New Root Page
              </Button>
              <Button
                onClick={() => {
                  handleCreatePage(null, null, 'folder');
                  setShowMobileCreateMenu(false);
                }}
                className="bg-elevated hover:bg-border border border-border text-text-primary shadow-lg"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                New Root Folder
              </Button>
            </div>
          )}
          <Button
            className="w-14 h-14 rounded-full bg-primary hover:bg-primary-hover shadow-[0_4px_20px_rgba(59,110,248,0.5)] -mt-10 border-4 border-background"
            onClick={() => setShowMobileCreateMenu(!showMobileCreateMenu)}
          >
            {showMobileCreateMenu ? <X className="h-6 w-6" /> : <Plus className="h-8 w-8" />}
          </Button>
        </div>

        <Button
          variant="ghost"
          className="flex flex-col items-center gap-1 text-text-secondary hover:text-primary"
          onClick={() => setShowExport(true)}
        >
          <Download className="h-5 w-5" />
          <span className="text-[10px] uppercase font-bold tracking-tighter">Export</span>
        </Button>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteDialog.isOpen}
        step={deleteDialog.step}
        title={deleteDialog.step === 1 ? "Remove Parent Page?" : "Confirm Destructive Action"}
        message={
          deleteDialog.step === 1
            ? `This page has sub-pages. Deleting it will also remove all nested content recursively.`
            : `Are you absolutely sure you want to delete "${pages.find(p => p.id === deleteDialog.pageId)?.title}"? This action cannot be undone.`
        }
        confirmText={deleteDialog.step === 1 ? "Proceed to Confirm" : "Delete Permanently"}
        onClose={() => setDeleteDialog({ isOpen: false, pageId: null, step: 1 })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default App;
