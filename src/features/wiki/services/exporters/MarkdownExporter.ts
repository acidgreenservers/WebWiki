import { WikiPage } from "../../types/wiki";

export class MarkdownExporter {
  static formatPage(page: WikiPage, contentOverride?: string): string {
    const content = contentOverride || page.content;
    return `# ${page.title}\n\n${content}`;
  }

  static getRelativePath(fromPage: WikiPage, toPage: WikiPage, subset: WikiPage[]): string {
    const fromPath = this.getAncestry(fromPage, subset);
    const toPath = this.getAncestry(toPage, subset);

    let commonDepth = 0;
    while (commonDepth < fromPath.length && commonDepth < toPath.length && fromPath[commonDepth].id === toPath[commonDepth].id) {
      commonDepth++;
    }

    const isFile = (p: WikiPage) => p.type === 'document' && !subset.some(child => child.parentId === p.id);

    const fromIsFile = isFile(fromPage);
    const upSteps = (fromPath.length - commonDepth) - (fromIsFile ? 1 : 0);
    const dots = upSteps > 0 ? "../".repeat(upSteps) : "./";

    const segments = toPath.slice(commonDepth).map(p => p.title.replace(/[/\\?%*:|"<>]/g, '-'));
    const toIsFile = isFile(toPage);

    if (toIsFile) {
      return `${dots}${segments.join('/')}.md`;
    } else {
      return `${dots}${segments.join('/')}${segments.length > 0 ? '/' : ''}index.md`;
    }
  }

  private static getAncestry(page: WikiPage, subset: WikiPage[]): WikiPage[] {
    const ancestry = [page];
    let current = page;
    while (current.parentId) {
      const parent = subset.find(p => p.id === current.parentId);
      if (!parent) break;
      ancestry.unshift(parent);
      current = parent;
    }
    return ancestry;
  }
}
