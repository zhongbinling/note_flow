import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { marked } from 'marked';
import TurndownService from 'turndown';
import {
  Edit3,
  Columns,
  ImageIcon,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Minus,
  FileEdit,
} from 'lucide-react';
import { useNoteStore } from '../../store/noteStore';
import { useThemeStore } from '../../store/themeStore';
import { SCROLL_TO_LINE_EVENT, SCROLL_TO_HEADING_INDEX_EVENT } from './Outline';

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Formatting toolbar button component
interface FormatButtonProps {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  isActive?: boolean;
}

function FormatButton({ icon, title, onClick, isActive }: FormatButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
        isActive ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'
      }`}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px' }}>
        {icon}
      </span>
    </button>
  );
}

// Configure TurndownService for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

// Rich Text Editor component - manages contentEditable without React re-render issues
interface RichTextEditorProps {
  initialHtml: string;
  noteId: string | null;
  onChange: (markdown: string, noteId: string) => void;
}

function RichTextEditor({ initialHtml, noteId, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastNotifiedMarkdownRef = useRef<string>('');
  const currentNoteIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);
  const inputTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store initial markdown to compare on unmount
  const initialMarkdownRef = useRef<string>('');

  // Store onChange in a ref to avoid stale closure in cleanup
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Convert HTML to Markdown and notify parent
  const notifyChange = useCallback(() => {
    if (!editorRef.current || !isInitializedRef.current || !currentNoteIdRef.current) return;

    // Capture the current note ID at the time of notification
    const noteIdAtTimeOfChange = currentNoteIdRef.current;

    const editorHtml = editorRef.current.innerHTML;

    // Don't save if content is empty or just whitespace
    if (!editorHtml || editorHtml.trim() === '' || editorHtml === '<br>') {
      return;
    }

    try {
      const markdown = turndownService.turndown(editorHtml);
      // Only notify if content actually changed
      if (markdown !== lastNotifiedMarkdownRef.current) {
        lastNotifiedMarkdownRef.current = markdown;
        // Pass the note ID to ensure we update the correct note
        onChange(markdown, noteIdAtTimeOfChange);
      }
    } catch {
      // Fallback to innerText if conversion fails
      const text = editorRef.current.innerText || '';
      if (text && text !== lastNotifiedMarkdownRef.current) {
        lastNotifiedMarkdownRef.current = text;
        onChange(text, noteIdAtTimeOfChange);
      }
    }
  }, [onChange]);

  // Initialize or update content when note changes
  useEffect(() => {
    if (editorRef.current && noteId) {
      // Only update if note ID changed (switching notes)
      if (currentNoteIdRef.current !== noteId) {
        // CRITICAL: Clear any pending notifications before switching to prevent data corruption
        if (inputTimeoutRef.current) {
          clearTimeout(inputTimeoutRef.current);
          inputTimeoutRef.current = null;
        }

        editorRef.current.innerHTML = initialHtml;
        currentNoteIdRef.current = noteId;
        lastNotifiedMarkdownRef.current = '';

        // Store initial markdown for comparison on unmount
        try {
          initialMarkdownRef.current = turndownService.turndown(initialHtml);
        } catch {
          initialMarkdownRef.current = '';
        }

        isInitializedRef.current = true;
      }
    }
  }, [initialHtml, noteId]);

  // Handle input events with debounce
  const handleInput = useCallback(() => {
    // Debounce the notification
    if (inputTimeoutRef.current) {
      clearTimeout(inputTimeoutRef.current);
    }
    inputTimeoutRef.current = setTimeout(() => {
      notifyChange();
    }, 300);
  }, [notifyChange]);

  // Handle blur - immediately save
  const handleBlur = useCallback(() => {
    if (inputTimeoutRef.current) {
      clearTimeout(inputTimeoutRef.current);
      inputTimeoutRef.current = null;
    }
    notifyChange();
  }, [notifyChange]);

  // Cleanup on unmount - SAVE any pending changes before unmounting
  useEffect(() => {
    return () => {
      // Clear any pending debounce
      if (inputTimeoutRef.current) {
        clearTimeout(inputTimeoutRef.current);
        inputTimeoutRef.current = null;
      }

      // CRITICAL: Save content before unmounting (when switching notes)
      if (editorRef.current && isInitializedRef.current && currentNoteIdRef.current) {
        const editorHtml = editorRef.current.innerHTML;
        if (editorHtml && editorHtml.trim() !== '' && editorHtml !== '<br>') {
          try {
            const markdown = turndownService.turndown(editorHtml);
            // Compare with initial markdown, not last notified
            // This ensures format changes are saved even if not yet notified
            if (markdown !== initialMarkdownRef.current) {
              // Use the ref to get the latest onChange function
              onChangeRef.current(markdown, currentNoteIdRef.current);
            }
          } catch {
            const text = editorRef.current.innerText || '';
            if (text && text !== initialMarkdownRef.current) {
              onChangeRef.current(text, currentNoteIdRef.current);
            }
          }
        }
      }
    };
  }, []);

  return (
    <div
      ref={editorRef}
      className="flex-1 overflow-y-auto p-6 prose dark:prose-invert max-w-none preview-container rich-editor"
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onBlur={handleBlur}
    />
  );
}

// Horizontal resizer hook
function useHorizontalResizer(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [splitRatio, setSplitRatio] = useState(0.5);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startRatioRef = useRef(0.5);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startRatioRef.current = splitRatio;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [splitRatio]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const delta = e.clientX - startXRef.current;
    const deltaRatio = delta / containerWidth;
    const newRatio = Math.min(Math.max(startRatioRef.current + deltaRatio, 0.2), 0.8);
    setSplitRatio(newRatio);
  }, [isResizing, containerRef]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return { splitRatio, isResizing, handleMouseDown };
}

export default function MarkdownEditor() {
  const activeNoteId = useNoteStore((state) => state.activeNoteId);
  const notes = useNoteStore((state) => state.notes);
  const updateNoteContent = useNoteStore((state) => state.updateNoteContent);
  const previewMode = useNoteStore((state) => state.previewMode);
  const setPreviewMode = useNoteStore((state) => state.setPreviewMode);
  const { isDark } = useThemeStore();

  const [localContent, setLocalContent] = useState<string>('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContent = useRef<string>('');
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { splitRatio, isResizing, handleMouseDown } = useHorizontalResizer(splitContainerRef);

  // Memoize the active note lookup
  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeNoteId),
    [notes, activeNoteId]
  );

  // Compress image if larger than 10KB
  const compressImage = useCallback((file: File, maxSizeKB: number = 10): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fileSizeKB = file.size / 1024;

      // If file is smaller than threshold, read directly
      if (fileSizeKB <= maxSizeKB) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      // Compress large images
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Calculate new dimensions (max 1920px on longest side)
        const maxDimension = 1920;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas
        ctx?.drawImage(img, 0, 0, width, height);

        // Try different quality levels until size is under threshold
        let quality = 0.8;
        let base64 = canvas.toDataURL('image/jpeg', quality);
        let compressedSizeKB = (base64.length * 3 / 4) / 1024; // Approximate base64 size

        while (compressedSizeKB > maxSizeKB && quality > 0.1) {
          quality -= 0.1;
          base64 = canvas.toDataURL('image/jpeg', quality);
          compressedSizeKB = (base64.length * 3 / 4) / 1024;
        }

        // If still too large, use PNG format for better compression on some images
        if (compressedSizeKB > maxSizeKB) {
          base64 = canvas.toDataURL('image/png');
        }

        resolve(base64);
      };

      img.onerror = reject;

      // Load image
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // Insert image markdown at cursor position
  const insertImageMarkdown = useCallback((base64: string, imageName: string = 'image') => {
    const imageMarkdown = `\n![${imageName}](${base64})\n`;

    // Insert image at current cursor position or append to content
    if (editorRef.current) {
      const editorView = editorRef.current;
      const { from, to } = editorView.state.selection.main;
      editorView.dispatch({
        changes: { from, to, insert: imageMarkdown },
        selection: { anchor: from + imageMarkdown.length },
      });
      editorView.focus();
    } else {
      // Fallback: append to content
      const newContent = localContent + imageMarkdown;
      setLocalContent(newContent);
      handleChange(newContent);
    }
  }, [localContent]);

  // Process and insert image file
  const processAndInsertImage = useCallback(async (file: File, imageName?: string) => {
    try {
      // Compress image if needed (larger than 10KB)
      const base64 = await compressImage(file, 10);
      const name = imageName || file.name.replace(/\.[^/.]+$/, '');

      // In Rich mode, insert image directly as HTML img element
      if (previewMode === 'rich') {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const img = document.createElement('img');
          img.src = base64;
          img.alt = name;
          img.style.maxWidth = '100%';

          range.deleteContents();
          range.insertNode(img);

          // Move cursor after the image
          range.setStartAfter(img);
          range.setEndAfter(img);
          selection.removeAllRanges();
          selection.addRange(range);

          // Trigger content change notification
          const richEditor = document.querySelector('.rich-editor') as HTMLDivElement;
          if (richEditor) {
            richEditor.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      } else {
        insertImageMarkdown(base64, name);
      }
    } catch (error) {
      console.error('Failed to process image:', error);
    }
  }, [compressImage, insertImageMarkdown, previewMode]);

  // Apply formatting in Rich mode using document.execCommand
  const applyRichFormat = useCallback((formatType: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    switch (formatType) {
      case 'bold':
        document.execCommand('bold', false);
        break;
      case 'italic':
        document.execCommand('italic', false);
        break;
      case 'heading1':
        document.execCommand('formatBlock', false, 'h1');
        break;
      case 'heading2':
        document.execCommand('formatBlock', false, 'h2');
        break;
      case 'heading3':
        document.execCommand('formatBlock', false, 'h3');
        break;
      case 'bulletList':
        document.execCommand('insertUnorderedList', false);
        break;
      case 'numberedList':
        document.execCommand('insertOrderedList', false);
        break;
      case 'quote':
        document.execCommand('formatBlock', false, 'blockquote');
        break;
      case 'code':
        // For inline code, wrap selection in <code> tag
        if (!range.collapsed) {
          const selectedText = range.toString();
          const codeSpan = document.createElement('code');
          codeSpan.textContent = selectedText;
          range.deleteContents();
          range.insertNode(codeSpan);
        }
        break;
      case 'link':
        const linkUrl = prompt('Enter URL:', 'https://');
        if (linkUrl) {
          document.execCommand('createLink', false, linkUrl);
        }
        break;
      case 'horizontalRule':
        document.execCommand('insertHorizontalRule', false);
        break;
      default:
        return;
    }

    // Trigger content change notification
    const richEditor = document.querySelector('.rich-editor') as HTMLDivElement;
    if (richEditor) {
      // Dispatch a custom input event to notify the RichTextEditor
      richEditor.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, []);

  // Apply markdown formatting to selected text or insert formatting
  const applyFormat = useCallback((formatType: string) => {
    // In Rich mode, use document.execCommand on the contentEditable element
    if (previewMode === 'rich') {
      applyRichFormat(formatType);
      return;
    }

    if (!editorRef.current) return;

    const editorView = editorRef.current;

    const { from, to } = editorView.state.selection.main;
    const selectedText = editorView.state.doc.sliceString(from, to);

    // Get surrounding context to check for existing formatting
    const lineStart = editorView.state.doc.lineAt(from).from;
    const lineEnd = editorView.state.doc.lineAt(to).to;
    const lineText = editorView.state.doc.sliceString(lineStart, lineEnd);

    // Get text before and after selection for inline format detection
    const beforeSelection = editorView.state.doc.sliceString(Math.max(0, from - 10), from);
    const afterSelection = editorView.state.doc.sliceString(to, Math.min(editorView.state.doc.length, to + 10));

    let insertText = '';
    let cursorOffset = 0;
    let newFrom = from;
    let newTo = to;

    switch (formatType) {
      case 'bold': {
        // Check if already bold (surrounded by **)
        const isBold = beforeSelection.endsWith('**') && afterSelection.startsWith('**');
        if (isBold && selectedText) {
          // Remove bold
          newFrom = from - 2;
          newTo = to + 2;
          insertText = selectedText;
          cursorOffset = insertText.length;
        } else if (selectedText) {
          // Check if selected text includes the ** markers
          if (selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length > 4) {
            insertText = selectedText.slice(2, -2);
            cursorOffset = insertText.length;
          } else {
            insertText = `**${selectedText}**`;
            cursorOffset = insertText.length;
          }
        } else {
          insertText = `****`;
          cursorOffset = 2;
        }
        break;
      }
      case 'italic': {
        // Check if already italic (surrounded by single *)
        // Need to be careful not to match ** (bold)
        const isItalic = (beforeSelection.endsWith('*') && !beforeSelection.endsWith('**')) &&
                         afterSelection.startsWith('*') && !afterSelection.startsWith('**');
        if (isItalic && selectedText) {
          newFrom = from - 1;
          newTo = to + 1;
          insertText = selectedText;
          cursorOffset = insertText.length;
        } else if (selectedText) {
          // Check if selected text includes the * markers
          if (selectedText.startsWith('*') && selectedText.endsWith('*') &&
              !selectedText.startsWith('**') && !selectedText.endsWith('**') && selectedText.length > 2) {
            insertText = selectedText.slice(1, -1);
            cursorOffset = insertText.length;
          } else {
            insertText = `*${selectedText}*`;
            cursorOffset = insertText.length;
          }
        } else {
          insertText = `**`;
          cursorOffset = 1;
        }
        break;
      }
      case 'heading1': {
        const trimmedLine = lineText.trimStart();
        const indent = lineText.length - trimmedLine.length;
        if (trimmedLine.startsWith('# ')) {
          // Remove heading
          newFrom = lineStart + indent;
          newTo = lineEnd;
          insertText = trimmedLine.slice(2);
          cursorOffset = indent + insertText.length;
        } else if (trimmedLine.startsWith('## ') || trimmedLine.startsWith('### ')) {
          // Change to H1
          newFrom = lineStart + indent;
          newTo = lineEnd;
          const headingContent = trimmedLine.replace(/^#{1,6}\s*/, '');
          insertText = `# ${headingContent}`;
          cursorOffset = indent + insertText.length;
        } else {
          newFrom = lineStart + indent;
          newTo = lineEnd;
          insertText = `# ${trimmedLine}`;
          cursorOffset = indent + insertText.length;
        }
        break;
      }
      case 'heading2': {
        const trimmedLine = lineText.trimStart();
        const indent = lineText.length - trimmedLine.length;
        if (trimmedLine.startsWith('## ')) {
          // Remove heading
          newFrom = lineStart + indent;
          newTo = lineEnd;
          insertText = trimmedLine.slice(3);
          cursorOffset = indent + insertText.length;
        } else if (trimmedLine.startsWith('# ') || trimmedLine.startsWith('### ')) {
          // Change to H2
          newFrom = lineStart + indent;
          newTo = lineEnd;
          const headingContent = trimmedLine.replace(/^#{1,6}\s*/, '');
          insertText = `## ${headingContent}`;
          cursorOffset = indent + insertText.length;
        } else {
          newFrom = lineStart + indent;
          newTo = lineEnd;
          insertText = `## ${trimmedLine}`;
          cursorOffset = indent + insertText.length;
        }
        break;
      }
      case 'heading3': {
        const trimmedLine = lineText.trimStart();
        const indent = lineText.length - trimmedLine.length;
        if (trimmedLine.startsWith('### ')) {
          // Remove heading
          newFrom = lineStart + indent;
          newTo = lineEnd;
          insertText = trimmedLine.slice(4);
          cursorOffset = indent + insertText.length;
        } else if (trimmedLine.startsWith('# ') || trimmedLine.startsWith('## ')) {
          // Change to H3
          newFrom = lineStart + indent;
          newTo = lineEnd;
          const headingContent = trimmedLine.replace(/^#{1,6}\s*/, '');
          insertText = `### ${headingContent}`;
          cursorOffset = indent + insertText.length;
        } else {
          newFrom = lineStart + indent;
          newTo = lineEnd;
          insertText = `### ${trimmedLine}`;
          cursorOffset = indent + insertText.length;
        }
        break;
      }
      case 'bulletList': {
        const trimmedLine = lineText.trimStart();
        const indent = lineText.length - trimmedLine.length;
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
          // Remove bullet
          newFrom = lineStart + indent;
          newTo = lineEnd;
          insertText = trimmedLine.slice(2);
          cursorOffset = indent + insertText.length;
        } else if (/^\d+\.\s/.test(trimmedLine)) {
          // Change from numbered to bullet
          newFrom = lineStart + indent;
          newTo = lineEnd;
          const listContent = trimmedLine.replace(/^\d+\.\s*/, '');
          insertText = `- ${listContent}`;
          cursorOffset = indent + insertText.length;
        } else {
          newFrom = lineStart + indent;
          newTo = lineEnd;
          insertText = `- ${trimmedLine}`;
          cursorOffset = indent + insertText.length;
        }
        break;
      }
      case 'numberedList': {
        const trimmedLine = lineText.trimStart();
        const indent = lineText.length - trimmedLine.length;
        if (/^\d+\.\s/.test(trimmedLine)) {
          // Remove numbered list
          newFrom = lineStart + indent;
          newTo = lineEnd;
          insertText = trimmedLine.replace(/^\d+\.\s*/, '');
          cursorOffset = indent + insertText.length;
        } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
          // Change from bullet to numbered
          newFrom = lineStart + indent;
          newTo = lineEnd;
          const listContent = trimmedLine.slice(2);
          insertText = `1. ${listContent}`;
          cursorOffset = indent + insertText.length;
        } else {
          newFrom = lineStart + indent;
          newTo = lineEnd;
          insertText = `1. ${trimmedLine}`;
          cursorOffset = indent + insertText.length;
        }
        break;
      }
      case 'quote': {
        const trimmedLine = lineText.trimStart();
        const indent = lineText.length - trimmedLine.length;
        if (trimmedLine.startsWith('> ')) {
          // Remove quote
          newFrom = lineStart + indent;
          newTo = lineEnd;
          insertText = trimmedLine.slice(2);
          cursorOffset = indent + insertText.length;
        } else {
          newFrom = lineStart + indent;
          newTo = lineEnd;
          insertText = `> ${trimmedLine}`;
          cursorOffset = indent + insertText.length;
        }
        break;
      }
      case 'code': {
        // Check for inline code
        const isInlineCode = beforeSelection.endsWith('`') && afterSelection.startsWith('`');
        if (isInlineCode && selectedText) {
          newFrom = from - 1;
          newTo = to + 1;
          insertText = selectedText;
          cursorOffset = insertText.length;
        } else if (selectedText) {
          // Check if selected text includes the ` markers
          if (selectedText.startsWith('`') && selectedText.endsWith('`') && selectedText.length > 2) {
            insertText = selectedText.slice(1, -1);
            cursorOffset = insertText.length;
          } else if (selectedText.includes('\n')) {
            insertText = `\`\`\`\n${selectedText}\n\`\`\``;
            cursorOffset = insertText.length;
          } else {
            insertText = `\`${selectedText}\``;
            cursorOffset = insertText.length;
          }
        } else {
          insertText = `\`code\``;
          cursorOffset = 1;
        }
        break;
      }
      case 'link':
        if (selectedText) {
          // Check if selected text is already a link
          const linkMatch = selectedText.match(/^\[([^\]]+)\]\([^)]+\)$/);
          if (linkMatch) {
            // Extract just the text
            insertText = linkMatch[1];
            cursorOffset = insertText.length;
          } else {
            insertText = `[${selectedText}](url)`;
            cursorOffset = insertText.length - 4;
          }
        } else {
          insertText = `[link text](url)`;
          cursorOffset = 1;
        }
        break;
      case 'horizontalRule':
        insertText = `\n---\n`;
        cursorOffset = insertText.length;
        break;
      default:
        return;
    }

    // Calculate selection range to keep text selected after formatting
    let selectionStart = newFrom + cursorOffset;
    let selectionEnd = newFrom + cursorOffset;

    // For inline formats (bold, italic, code, link), select the content
    if (['bold', 'italic', 'code', 'link'].includes(formatType) && selectedText) {
      if (formatType === 'bold') {
        if (insertText.startsWith('**') && insertText.endsWith('**')) {
          selectionStart = newFrom + 2;
          selectionEnd = newFrom + insertText.length - 2;
        } else {
          selectionStart = newFrom;
          selectionEnd = newFrom + insertText.length;
        }
      } else if (formatType === 'italic') {
        if (insertText.startsWith('*') && insertText.endsWith('*') && !insertText.startsWith('**')) {
          selectionStart = newFrom + 1;
          selectionEnd = newFrom + insertText.length - 1;
        } else {
          selectionStart = newFrom;
          selectionEnd = newFrom + insertText.length;
        }
      } else if (formatType === 'code') {
        if (insertText.startsWith('`') && insertText.endsWith('`') && !insertText.startsWith('```')) {
          selectionStart = newFrom + 1;
          selectionEnd = newFrom + insertText.length - 1;
        } else {
          selectionStart = newFrom;
          selectionEnd = newFrom + insertText.length;
        }
      } else if (formatType === 'link') {
        // Select the URL part for easy editing
        const urlStart = insertText.indexOf('](') + 2;
        const urlEnd = insertText.lastIndexOf(')');
        if (urlStart < urlEnd) {
          selectionStart = newFrom + urlStart;
          selectionEnd = newFrom + urlEnd;
        }
      }
    }

    editorView.dispatch({
      changes: { from: newFrom, to: newTo, insert: insertText },
      selection: { anchor: selectionStart, head: selectionEnd },
    });
    editorView.focus();
  }, [previewMode]);

  // Handle image upload from file input
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      return;
    }

    await processAndInsertImage(file);

    // Reset input so same file can be selected again
    e.target.value = '';
  }, [processAndInsertImage]);

  // Handle clipboard paste for images
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      // Find image item in clipboard
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            // Generate name based on timestamp for screenshots
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            await processAndInsertImage(file, `screenshot-${timestamp}`);
          }
          break;
        }
      }
    };

    // Add paste event listener to document
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [processAndInsertImage]);

  // Handle keyboard shortcuts for formatting
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Ctrl or Cmd is pressed
      if (!(e.ctrlKey || e.metaKey)) return;

      // Only handle shortcuts when in edit or live mode
      if (previewMode === 'preview') return;

      const key = e.key.toLowerCase();

      switch (key) {
        case 'b':
          e.preventDefault();
          e.stopPropagation();
          applyFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          e.stopPropagation();
          applyFormat('italic');
          break;
        case 'k':
          e.preventDefault();
          e.stopPropagation();
          applyFormat('link');
          break;
        case '`':
          e.preventDefault();
          e.stopPropagation();
          applyFormat('code');
          break;
        case '1':
          e.preventDefault();
          e.stopPropagation();
          applyFormat('heading1');
          break;
        case '2':
          e.preventDefault();
          e.stopPropagation();
          applyFormat('heading2');
          break;
        case '3':
          e.preventDefault();
          e.stopPropagation();
          applyFormat('heading3');
          break;
        case 'u':
          e.preventDefault();
          e.stopPropagation();
          applyFormat('bulletList');
          break;
        case 'o':
          e.preventDefault();
          e.stopPropagation();
          applyFormat('numberedList');
          break;
        case 'q':
          e.preventDefault();
          e.stopPropagation();
          applyFormat('quote');
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [applyFormat, previewMode]);

  // Trigger image file input
  const handleImageButtonClick = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  // Track pending save content and note ID for immediate save on switch
  const pendingSaveRef = useRef<{ noteId: string; value: string } | null>(null);

  // Sync local content when note changes
  useEffect(() => {
    if (activeNote) {
      // CRITICAL: Save any pending changes before switching notes
      if (pendingSaveRef.current && pendingSaveRef.current.value !== lastSavedContent.current) {
        updateNoteContent(pendingSaveRef.current.noteId, pendingSaveRef.current.value);
        lastSavedContent.current = pendingSaveRef.current.value;
        pendingSaveRef.current = null;
      }

      // Clear any pending debounce saves
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      setLocalContent(activeNote.content);
      lastSavedContent.current = activeNote.content;
    }
  }, [activeNoteId, activeNote, updateNoteContent]);

  // Track the current note ID for debounce validation
  const activeNoteIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeNoteIdRef.current = activeNoteId;
  }, [activeNoteId]);

  // Handle changes with debounced save
  // Optional noteIdForValidation is used to ensure we don't update wrong note during race conditions
  const handleChange = useCallback((value: string, noteIdForValidation?: string) => {
    if (!activeNoteId) return;

    // If noteIdForValidation is provided, verify it matches current active note
    // This prevents race conditions when switching notes quickly
    if (noteIdForValidation && noteIdForValidation !== activeNoteId) {
      console.log('[NoteFlow] Blocked save - noteId mismatch');
      return;
    }

    // Update local content immediately
    setLocalContent(value);

    // Store pending save for immediate save on switch
    pendingSaveRef.current = { noteId: activeNoteId, value };

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Capture the note ID at the time of change for validation in debounce callback
    const noteIdAtTimeOfChange = activeNoteId;

    // Debounce save to store
    debounceRef.current = setTimeout(() => {
      // CRITICAL: Double-check that we're still on the same note before saving
      // Use ref to get the current active note ID (not the closure value)
      if (activeNoteIdRef.current !== noteIdAtTimeOfChange) {
        console.log('[NoteFlow] Blocked debounce save - note switched');
        return;
      }

      if (value !== lastSavedContent.current) {
        updateNoteContent(noteIdAtTimeOfChange, value);
        lastSavedContent.current = value;
        pendingSaveRef.current = null; // Clear pending after successful save
      }
    }, 1000);
  }, [activeNoteId, updateNoteContent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Handle scroll to line event from Outline (for Edit/Split modes only)
  useEffect(() => {
    const handleScrollToLine = (e: CustomEvent<{ line: number }>) => {
      const { line } = e.detail;

      if (editorRef.current && editorContainerRef.current && (previewMode === 'edit' || previewMode === 'live')) {
        // In edit/split mode, scroll the editor to the line
        // Note: We scroll editorContainerRef, not editorView.scrollDOM,
        // because our CSS sets overflow:visible on .cm-scroller
        const editorView = editorRef.current;
        const container = editorContainerRef.current;
        const doc = editorView.state.doc;

        if (line > 0 && line <= doc.lines) {
          const linePos = doc.line(line).from;

          // Get the line block to find its position in the document
          const lineBlock = editorView.lineBlockAt(linePos);

          // Calculate scroll position: block.top gives us the position from document top
          // Add a margin so the line isn't at the very edge
          const margin = 50;
          const targetScrollTop = Math.max(0, lineBlock.top - margin);

          // Scroll the container
          container.scrollTop = targetScrollTop;

          // Set cursor to the beginning of the line
          editorView.dispatch({
            selection: { anchor: linePos },
          });
        }
      }
    };

    window.addEventListener(SCROLL_TO_LINE_EVENT, handleScrollToLine as EventListener);
    return () => {
      window.removeEventListener(SCROLL_TO_LINE_EVENT, handleScrollToLine as EventListener);
    };
  }, [previewMode]);

  // Handle scroll to heading index event from Outline (for Rich/Preview modes)
  useEffect(() => {
    const handleScrollToHeadingIndex = (e: CustomEvent<{ index: number; text: string }>) => {
      const { index, text } = e.detail;

      if (previewMode === 'preview' && previewRef.current) {
        // In Preview mode, scroll the preview container
        const previewContainer = previewRef.current;
        const headings = previewContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');

        // First try to find by text content
        let targetHeading: HTMLElement | null = null;
        for (const heading of headings) {
          if (heading.textContent?.trim() === text.trim()) {
            targetHeading = heading as HTMLElement;
            break;
          }
        }

        // Fallback to index if text not found
        if (!targetHeading && index >= 0 && index < headings.length) {
          targetHeading = headings[index] as HTMLElement;
        }

        if (targetHeading) {
          const containerRect = previewContainer.getBoundingClientRect();
          const headingRect = targetHeading.getBoundingClientRect();
          const scrollOffset = headingRect.top - containerRect.top + previewContainer.scrollTop;
          previewContainer.scrollTo({ top: scrollOffset, behavior: 'auto' });

          // Highlight the heading briefly
          targetHeading.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
          setTimeout(() => {
            targetHeading!.style.backgroundColor = '';
          }, 500);
        }
      } else if (previewMode === 'rich') {
        // In Rich mode, scroll the contentEditable container
        // Use text matching to find the correct heading (more reliable than index)
        const richEditor = document.querySelector('.rich-editor') as HTMLDivElement;
        if (richEditor) {
          const headings = richEditor.querySelectorAll('h1, h2, h3, h4, h5, h6');

          // First try to find by text content
          let targetHeading: HTMLElement | null = null;
          for (const heading of headings) {
            if (heading.textContent?.trim() === text.trim()) {
              targetHeading = heading as HTMLElement;
              break;
            }
          }

          // Fallback to index if text not found
          if (!targetHeading && index >= 0 && index < headings.length) {
            targetHeading = headings[index] as HTMLElement;
          }

          if (targetHeading) {
            // Use scroll method instead of scrollIntoView to avoid layout issues
            const richEditor = document.querySelector('.rich-editor') as HTMLDivElement;
            if (richEditor && targetHeading) {
              const editorRect = richEditor.getBoundingClientRect();
              const headingRect = targetHeading.getBoundingClientRect();
              const scrollOffset = headingRect.top - editorRect.top + richEditor.scrollTop;
              richEditor.scrollTo({ top: scrollOffset, behavior: 'auto' });
            }

            // Highlight the heading briefly to give visual feedback
            targetHeading.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            setTimeout(() => {
              targetHeading!.style.backgroundColor = '';
            }, 500);
          }
        }
      }
    };

    window.addEventListener(SCROLL_TO_HEADING_INDEX_EVENT, handleScrollToHeadingIndex as EventListener);
    return () => {
      window.removeEventListener(SCROLL_TO_HEADING_INDEX_EVENT, handleScrollToHeadingIndex as EventListener);
    };
  }, [previewMode]);

  // CodeMirror extensions
  const extensions = useMemo(() => [
    markdown({ base: markdownLanguage }),
    EditorView.lineWrapping,
  ], []);

  // Rendered HTML for preview - use localContent for all modes
  const renderedHtml = useMemo(() => {
    // In Rich mode, use activeNote.content directly to ensure correct content when switching notes
    // This avoids any race conditions with localContent updates
    if (previewMode === 'rich' && activeNote) {
      return marked.parse(activeNote.content) as string;
    }
    const contentToRender = localContent;
    return marked.parse(contentToRender) as string;
  }, [previewMode, localContent, activeNote]);

  if (!activeNote) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400"
      >
        <div className="text-center">
          <svg
            className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-lg font-medium">No note selected</p>
          <p className="text-sm mt-1">Choose a note from the list or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 overflow-hidden min-h-0">
      {/* Hidden file input for image upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {/* Formatting buttons - show in edit, live and rich mode */}
        <div className="flex items-center gap-0.5">
          {(previewMode === 'edit' || previewMode === 'live' || previewMode === 'rich') && (
            <>
              <FormatButton
                icon={<Bold size={14} />}
                title="Bold (Ctrl+B)"
                onClick={() => applyFormat('bold')}
                key="bold-btn"
              />
              <FormatButton
                icon={<Italic size={14} />}
                title="Italic (Ctrl+I)"
                onClick={() => applyFormat('italic')}
              />
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
              <FormatButton
                icon={<Heading1 size={14} />}
                title="Heading 1 (Ctrl+1)"
                onClick={() => applyFormat('heading1')}
              />
              <FormatButton
                icon={<Heading2 size={14} />}
                title="Heading 2 (Ctrl+2)"
                onClick={() => applyFormat('heading2')}
              />
              <FormatButton
                icon={<Heading3 size={14} />}
                title="Heading 3 (Ctrl+3)"
                onClick={() => applyFormat('heading3')}
              />
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
              <FormatButton
                icon={<List size={14} />}
                title="Bullet List (Ctrl+U)"
                onClick={() => applyFormat('bulletList')}
              />
              <FormatButton
                icon={<ListOrdered size={14} />}
                title="Numbered List (Ctrl+O)"
                onClick={() => applyFormat('numberedList')}
              />
              <FormatButton
                icon={<Quote size={14} />}
                title="Quote (Ctrl+Q)"
                onClick={() => applyFormat('quote')}
              />
              <FormatButton
                icon={<Code size={14} />}
                title="Code (Ctrl+`)"
                onClick={() => applyFormat('code')}
              />
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
              <FormatButton
                icon={<Link size={14} />}
                title="Link (Ctrl+K)"
                onClick={() => applyFormat('link')}
              />
              <FormatButton
                icon={<ImageIcon size={14} />}
                title="Insert Image"
                onClick={handleImageButtonClick}
              />
              <FormatButton
                icon={<Minus size={14} />}
                title="Horizontal Rule"
                onClick={() => applyFormat('horizontalRule')}
              />
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
            </>
          )}
          {(previewMode === 'edit' || previewMode === 'live' || previewMode === 'rich') && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {previewMode === 'edit' && <Edit3 size={12} />}
              {previewMode === 'live' && <Columns size={12} />}
              {previewMode === 'rich' && <FileEdit size={12} />}
              <span className="capitalize">{previewMode === 'rich' ? 'Rich Text' : `${previewMode} mode`}</span>
            </div>
          )}
        </div>

        {/* Mode buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPreviewMode('edit')}
            className={`px-2 py-0.5 rounded text-xs ${previewMode === 'edit' ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
          >
            Edit
          </button>
          <button
            onClick={() => setPreviewMode('live')}
            className={`px-2 py-0.5 rounded text-xs ${previewMode === 'live' ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
          >
            Split
          </button>
          <button
            onClick={() => setPreviewMode('preview')}
            className={`px-2 py-0.5 rounded text-xs ${previewMode === 'preview' ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
          >
            Preview
          </button>
          <button
            onClick={() => setPreviewMode('rich')}
            className={`px-2 py-0.5 rounded text-xs ${previewMode === 'rich' ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
          >
            Rich
          </button>
        </div>
      </div>

      {/* Editor / Preview Container */}
      <div ref={splitContainerRef} className="flex-1 flex min-h-0 overflow-hidden">
        {/* Editor */}
        {(previewMode === 'edit' || previewMode === 'live') && (
          <div
            ref={editorContainerRef}
            className={`${previewMode === 'live' ? '' : 'flex-1'} h-full min-h-0 overflow-y-auto overscroll-contain`}
            style={previewMode === 'live' ? { width: `${splitRatio * 100}%` } : undefined}
          >
            <CodeMirror
              key={activeNoteId}
              value={localContent}
              height="auto"
              minHeight="100%"
              extensions={extensions}
              onChange={(value) => handleChange(value)}
              theme={isDark ? 'dark' : 'light'}
              placeholder="Start writing in Markdown..."
              basicSetup={{
                lineNumbers: false,
                foldGutter: false,
                highlightActiveLine: false,
              }}
              onCreateEditor={(view) => {
                editorRef.current = view;
              }}
            />
          </div>
        )}

        {/* Resizer handle for live mode */}
        {previewMode === 'live' && (
          <div
            className={`w-1 cursor-col-resize flex-shrink-0 ${
              isResizing ? 'bg-primary-500' : 'bg-transparent hover:bg-primary-300 dark:hover:bg-primary-600'
            } transition-colors`}
            onMouseDown={handleMouseDown}
          />
        )}

        {/* Preview */}
        {(previewMode === 'preview' || previewMode === 'live') && (
          <div
            ref={previewRef}
            className={`${previewMode === 'live' ? '' : 'flex-1'} overflow-y-auto p-6 prose dark:prose-invert max-w-none preview-container`}
            style={previewMode === 'live' ? { width: `${(1 - splitRatio) * 100}%` } : undefined}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        )}

        {/* Rich Text Editor Mode - editable preview with toolbar support */}
        {previewMode === 'rich' && (
          <>
            {/* Hidden editor for maintaining source */}
            <div className="hidden">
              <CodeMirror
                key={activeNoteId}
                value={localContent}
                height="auto"
                extensions={extensions}
                onChange={(value) => handleChange(value)}
                theme={isDark ? 'dark' : 'light'}
                onCreateEditor={(view) => {
                  editorRef.current = view;
                }}
              />
            </div>
            {/* Editable Preview display */}
            <RichTextEditor
              key={activeNoteId}
              initialHtml={renderedHtml}
              noteId={activeNoteId}
              onChange={handleChange}
            />
          </>
        )}
      </div>

      {/* Styles */}
      <style>{`
        .cm-editor {
          height: auto !important;
        }
        .cm-scroller {
          overflow: visible !important;
          padding: 1rem;
        }
        .cm-content {
          min-height: auto;
        }
        .preview-container {
          font-family: 'Inter', system-ui, sans-serif;
          line-height: 1.7;
          overscroll-behavior: contain;
          color: ${isDark ? '#e5e7eb' : '#1f2937'};
        }
        .preview-container h1 { font-size: 2em; font-weight: 700; margin-bottom: 0.5em; color: ${isDark ? '#f9fafb' : '#111827'}; }
        .preview-container h2 { font-size: 1.5em; font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; color: ${isDark ? '#f3f4f6' : '#1f2937'}; }
        .preview-container h3 { font-size: 1.25em; font-weight: 600; margin-top: 1.25em; margin-bottom: 0.5em; color: ${isDark ? '#e5e7eb' : '#374151'}; }
        .preview-container p { margin-bottom: 1em; }
        .preview-container ul, .preview-container ol { padding-left: 1.5em; margin-bottom: 1em; }
        .preview-container li { margin-bottom: 0.25em; }
        .preview-container strong, .preview-container b {
          color: ${isDark ? '#f9fafb' : '#111827'};
          font-weight: 600;
        }
        .preview-container code {
          background: ${isDark ? '#4b5563' : '#f3f4f6'};
          color: ${isDark ? '#f9fafb' : '#1f2937'};
          padding: 0.125em 0.375em;
          border-radius: 0.25em;
          font-size: 0.875em;
        }
        .preview-container pre {
          background: ${isDark ? '#374151' : '#f3f4f6'};
          padding: 1em;
          border-radius: 0.5em;
          overflow-x: auto;
          margin-bottom: 1em;
          border: 1px solid ${isDark ? '#4b5563' : '#e5e7eb'};
        }
        .preview-container pre code {
          background: transparent;
          color: ${isDark ? '#e5e7eb' : '#1f2937'};
          padding: 0;
        }
        .preview-container pre strong, .preview-container pre b {
          color: ${isDark ? '#f9fafb' : '#111827'};
        }
        .preview-container blockquote {
          border-left: 4px solid ${isDark ? '#6b7280' : '#9ca3af'};
          padding-left: 1em;
          margin-left: 0;
          color: ${isDark ? '#9ca3af' : '#6b7280'};
          background: ${isDark ? '#1f2937' : '#f9fafb'};
          padding: 0.5em 1em;
          border-radius: 0 0.25em 0.25em 0;
        }
        .preview-container blockquote strong, .preview-container blockquote b {
          color: ${isDark ? '#d1d5db' : '#374151'};
        }
        .preview-container a {
          color: ${isDark ? '#60a5fa' : '#0ea5e9'};
          text-decoration: underline;
        }
        .preview-container table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1em;
        }
        .preview-container th, .preview-container td {
          border: 1px solid ${isDark ? '#4b5563' : '#e5e7eb'};
          padding: 0.5em;
        }
        .preview-container th {
          background: ${isDark ? '#374151' : '#f3f4f6'};
          color: ${isDark ? '#f9fafb' : '#1f2937'};
        }
        .preview-container img {
          max-width: 100%;
          border-radius: 0.5em;
        }
        .preview-container hr {
          border: none;
          border-top: 1px solid ${isDark ? '#4b5563' : '#e5e7eb'};
          margin: 2em 0;
        }
        .rich-editor {
          outline: none;
          min-height: 100%;
        }
        .rich-editor:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
}
