import { useEffect, useState } from 'react';
import { useNoteStore } from '../../store/noteStore';

interface Heading {
  level: number;
  text: string;
  line: number;
}

// Custom event for scrolling to line (used in Edit/Split mode)
export const SCROLL_TO_LINE_EVENT = 'noteflow-scroll-to-line';

// Custom event for scrolling to heading by index (used in Rich/Preview mode)
export const SCROLL_TO_HEADING_INDEX_EVENT = 'noteflow-scroll-to-heading-index';

export function dispatchScrollToLine(line: number) {
  window.dispatchEvent(new CustomEvent(SCROLL_TO_LINE_EVENT, { detail: { line } }));
}

export function dispatchScrollToHeadingIndex(index: number, text: string) {
  window.dispatchEvent(new CustomEvent(SCROLL_TO_HEADING_INDEX_EVENT, { detail: { index, text } }));
}

export default function Outline() {
  const { getActiveNote } = useNoteStore();
  const activeNote = getActiveNote();
  const [headings, setHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    if (!activeNote) {
      setHeadings([]);
      return;
    }

    // Extract headings from markdown content
    const lines = activeNote.content.split('\n');
    const extracted: Heading[] = [];

    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        extracted.push({
          level: match[1].length,
          text: match[2],
          line: index + 1,
        });
      }
    });

    setHeadings(extracted);
  }, [activeNote?.content, activeNote]);

  const handleHeadingClick = (index: number, line: number, text: string) => {
    // Dispatch line event for Edit/Split modes
    dispatchScrollToLine(line);
    // Dispatch heading index event for Rich/Preview modes
    dispatchScrollToHeadingIndex(index, text);
  };

  if (!activeNote || headings.length === 0) {
    return (
      <div className="w-56 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Outline
        </h3>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          No headings in this note
        </p>
      </div>
    );
  }

  return (
    <div className="w-56 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto min-h-0 overscroll-contain flex-shrink-0">
      <div className="p-4">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Outline
        </h3>
        <nav className="space-y-1">
          {headings.map((heading, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleHeadingClick(index, heading.line, heading.text)}
              className={`w-full text-left text-sm py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                heading.level === 1
                  ? 'font-semibold text-gray-900 dark:text-gray-100'
                  : heading.level === 2
                  ? 'pl-4 text-gray-700 dark:text-gray-300'
                  : heading.level === 3
                  ? 'pl-6 text-gray-600 dark:text-gray-400'
                  : 'pl-8 text-gray-500 dark:text-gray-500'
              }`}
            >
              {heading.text}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
