import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';

interface ResizableProps {
  children: ReactNode;
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
  direction?: 'left' | 'right';
  className?: string;
  onWidthChange?: (width: number) => void;
}

export default function Resizable({
  children,
  defaultWidth,
  minWidth = 100,
  maxWidth = 600,
  direction = 'right',
  className = '',
  onWidthChange,
}: ResizableProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const delta = e.clientX - startXRef.current;
    const newWidth = direction === 'right'
      ? startWidthRef.current + delta
      : startWidthRef.current - delta;

    const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
    setWidth(clampedWidth);
    onWidthChange?.(clampedWidth);
  }, [isResizing, direction, minWidth, maxWidth, onWidthChange]);

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

  const resizerPosition = direction === 'right' ? 'right-0' : 'left-0';
  const resizerClass = direction === 'right'
    ? 'cursor-col-resize hover:bg-primary-500'
    : 'cursor-col-resize hover:bg-primary-500';

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: `${width}px` }}
    >
      {children}
      {/* Resizer handle */}
      <div
        className={`absolute top-0 bottom-0 w-1 ${resizerPosition} ${resizerClass} ${
          isResizing ? 'bg-primary-500' : 'bg-transparent hover:bg-primary-300 dark:hover:bg-primary-600'
        } transition-colors z-10`}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
