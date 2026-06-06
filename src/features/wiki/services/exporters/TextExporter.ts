import { WikiPage } from "../../types/wiki";

export class TextExporter {
  static formatPage(page: WikiPage): string {
    const title = page.title;
    const separator = "=".repeat(title.length);

    // Strip markdown syntax
    const cleanContent = page.content
      .replace(/#+\s+/g, '') // Headers
      .replace(/(\*\*|__)(.*?)\1/g, '$2') // Bold
      .replace(/(\*|_)(.*?)\1/g, '$2') // Italic
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
      .replace(/`{3}[\s\S]*?`{3}/g, (match) => match.replace(/`{3}/g, '')) // Code blocks
      .replace(/`(.+?)`/g, '$1') // Inline code
      .replace(/^\s*[-*+]\s+/gm, '') // Unordered lists
      .replace(/^\s*\d+\.\s+/gm, ''); // Ordered lists

    return `${title}\n${separator}\n\n${cleanContent}`;
  }
}
