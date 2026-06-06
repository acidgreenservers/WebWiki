import { WikiPage } from "../../types/wiki";

export class HTMLExporter {
  static generateSinglePage(page: WikiPage): string {
    const charCount = page.content.length;
    const wordCount = page.content.trim() ? page.content.trim().split(/\s+/).length : 0;
    const itemLinks = (page.content.match(/\[(.*?)\]\(.*?\)/g) || []).length;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page.title} - Article Writer</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #0d1117;
            color: #e6edf3;
        }
        .article-card {
            background-color: #161b22;
            border-left: 4px solid #3b6ef8;
            border-radius: 4px;
        }
        .prose { max-width: none; color: #8b949e; }
        .prose h1, .prose h2 { color: #3b6ef8; border-bottom: 1px solid #30363d; padding-bottom: 0.5rem; margin-top: 2rem; }
        .prose p { margin-bottom: 1.5rem; line-height: 1.8; }
        .footer-link {
            background-color: #21262d;
            border: 1px solid #30363d;
            transition: all 0.2s;
        }
        .footer-link:hover {
            background-color: #30363d;
            border-color: #8b949e;
        }
    </style>
</head>
<body class="min-h-screen flex flex-col p-8 md:p-16">
    <div class="max-w-4xl mx-auto w-full flex-1">
        <h1 class="text-4xl font-bold text-center mb-12">${page.title}</h1>

        <div class="article-card p-6 mb-12">
            <div class="grid grid-cols-2 gap-y-3 text-sm">
                <div class="text-gray-500 uppercase tracking-tighter font-medium">Article Title</div>
                <div class="text-right font-mono">${page.title}</div>

                <div class="text-gray-500 uppercase tracking-tighter font-medium border-t border-gray-800 pt-3">Character Count</div>
                <div class="text-right font-mono border-t border-gray-800 pt-3">${charCount}</div>

                <div class="text-gray-500 uppercase tracking-tighter font-medium border-t border-gray-800 pt-3">Word Count</div>
                <div class="text-right font-mono border-t border-gray-800 pt-3">${wordCount}</div>

                <div class="text-gray-500 uppercase tracking-tighter font-medium border-t border-gray-800 pt-3">Items</div>
                <div class="text-right font-mono border-t border-gray-800 pt-3">${itemLinks}</div>

                <div class="text-gray-500 uppercase tracking-tighter font-medium border-t border-gray-800 pt-3">Exported By</div>
                <div class="text-right font-mono border-t border-gray-800 pt-3 italic">Article Writer</div>
            </div>
        </div>

        <div id="content" class="prose prose-invert lg:prose-xl">
            <!-- Content Injected -->
        </div>
    </div>

    <footer class="mt-20 pt-8 border-t border-gray-800 flex flex-col items-center gap-6">
        <a href="https://github.com/acidgreenservers" target="_blank" class="footer-link flex items-center px-4 py-2 rounded-full text-xs font-medium text-white gap-2">
            <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
            AcidGreenServers GitHub
        </a>
        <div class="flex justify-between w-full text-[10px] text-gray-600 uppercase tracking-widest px-4">
            <span>Article Writer 2026</span>
            <span>Created by: AcidGreen Servers</span>
        </div>
    </footer>

    <script>
        const content = \`${page.content.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
        document.getElementById('content').innerHTML = DOMPurify.sanitize(marked.parse(content));
    </script>
</body>
</html>
`;
  }

  static generateReader(rootPage: WikiPage, subset: WikiPage[]): string {
    const data = JSON.stringify(subset.map(p => ({
      ...p,
      childPages: subset.filter(c => c.parentId === p.id).map(c => ({ id: c.id, title: c.title }))
    })));

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${rootPage.title} - WebWiki Reader</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --md-sys-color-primary: #3b6ef8;
            --md-sys-color-on-primary: #ffffff;
            --md-sys-color-surface: #0d1117;
            --md-sys-color-on-surface: #e6edf3;
            --md-sys-color-surface-variant: #161b22;
            --md-sys-color-outline: #30363d;
        }
        body {
            font-family: 'Roboto', sans-serif;
            background-color: var(--md-sys-color-surface);
            color: var(--md-sys-color-on-surface);
        }
        .prose { max-width: none; color: var(--md-sys-color-on-surface); }
        .prose h1, .prose h2, .prose h3 { color: var(--md-sys-color-primary); }
        .prose a { color: var(--md-sys-color-primary); text-decoration: none; }
        .prose a:hover { text-decoration: underline; }
        .sidebar-item.active {
            background-color: rgba(59, 110, 248, 0.1);
            border-left: 4px solid var(--md-sys-color-primary);
        }
    </style>
</head>
<body class="flex h-screen overflow-hidden">
    <aside class="w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col">
        <div class="p-4 border-b border-[#30363d]">
            <h1 class="text-xl font-bold text-[#3b6ef8]">${rootPage.title}</h1>
            <p class="text-[10px] text-gray-500 uppercase tracking-widest mt-1">WebWiki Reader</p>
        </div>
        <nav id="sidebar" class="flex-1 overflow-y-auto p-2 space-y-1"></nav>
    </aside>

    <main class="flex-1 overflow-y-auto bg-[#0d1117] p-8">
        <div id="content" class="max-w-4xl mx-auto prose prose-invert lg:prose-xl"></div>
    </main>

    <script>
        const pages = ${data};
        const rootId = "${rootPage.id}";
        let currentPageId = rootId;

        function renderSidebar() {
            const sidebar = document.getElementById('sidebar');
            sidebar.innerHTML = '';

            function buildTree(parentId, level = 0) {
                const children = pages.filter(p => p.parentId === parentId);
                children.forEach(page => {
                    const div = document.createElement('div');
                    div.className = \`sidebar-item p-2 rounded cursor-pointer hover:bg-gray-800 transition-colors \${page.id === currentPageId ? 'active' : ''}\`;
                    div.style.paddingLeft = \`\${level * 16 + 8}px\`;
                    div.innerHTML = \`<span class="text-sm">\${page.type === 'folder' ? '📁 ' : '📄 '}\${page.title}</span>\`;
                    div.onclick = () => navigateTo(page.id);
                    sidebar.appendChild(div);
                    buildTree(page.id, level + 1);
                });
            }

            const root = pages.find(p => p.id === rootId);
            if (root) {
                const div = document.createElement('div');
                div.className = \`sidebar-item p-2 rounded cursor-pointer hover:bg-gray-800 transition-colors \${root.id === currentPageId ? 'active' : ''}\`;
                div.innerHTML = \`<span class="font-bold text-sm">🏠 \${root.title}</span>\`;
                div.onclick = () => navigateTo(root.id);
                sidebar.appendChild(div);
                buildTree(rootId, 1);
            }
        }

        function navigateTo(id) {
            currentPageId = id;
            const page = pages.find(p => p.id === id);
            if (!page) return;

            const contentDiv = document.getElementById('content');
            let renderedContent = page.content;
            const linkRegex = /\\[(.*?)\\]\\((.*?)\\)/g;
            renderedContent = renderedContent.replace(linkRegex, (match, text, targetId) => {
                const targetExists = pages.some(p => p.id === targetId);
                if (targetExists) return \`<a href="javascript:navigateTo('\${targetId}')">\${text}</a>\`;
                return match;
            });

            contentDiv.innerHTML = \`
                <h1 class="text-4xl font-bold mb-4 border-b border-gray-800 pb-4">\${page.title}</h1>
                <div class="mt-4 text-gray-300">\${DOMPurify.sanitize(marked.parse(renderedContent))}</div>
            \`;

            renderSidebar();
            window.scrollTo(0, 0);
        }

        navigateTo(rootId);
    </script>
</body>
</html>
    `;
  }
}
