import { MAX_CHUNK_CHARS } from './knowledge.constants';

/**
 * Splits a markdown document into self-contained chunks.
 *
 * Rule: one `## ` section = one chunk, because a section talks about one topic.
 * Each chunk starts with "<document title> — <section title>", so even a lone chunk
 * says what it is about (better embeddings, better answers).
 * A section longer than MAX_CHUNK_CHARS is split again by paragraphs.
 */
export function chunkMarkdown(markdown: string): string[] {
  const docTitle = markdown.match(/^# (.+)$/m)?.[1]?.trim() ?? '';
  const sections = markdown.split(/^## /m).slice(1); // [0] is the part before the first section

  return sections.flatMap((section) => {
    const [heading = '', ...bodyLines] = section.split('\n');
    const prefix = docTitle ? `${docTitle} — ${heading.trim()}` : heading.trim();
    const body = bodyLines.join('\n').trim();
    return splitByParagraphs(body).map((part) => `${prefix}\n${part}`);
  });
}

function splitByParagraphs(text: string): string[] {
  if (text.length <= MAX_CHUNK_CHARS) return [text];

  const parts: string[] = [];
  let current = '';
  for (const paragraph of text.split(/\n{2,}/)) {
    if (current && current.length + paragraph.length > MAX_CHUNK_CHARS) {
      parts.push(current);
      current = '';
    }
    current = current ? `${current}\n\n${paragraph}` : paragraph;
  }
  if (current) parts.push(current);
  return parts;
}
