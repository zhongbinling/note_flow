import { FileText, Clock, Tag } from 'lucide-react';
import { useNoteStore } from '../../store/noteStore';
import { formatDistanceToNow } from '../../utils/date';

export default function NoteList() {
  const { getFilteredNotes, activeNoteId, setActiveNote } = useNoteStore();
  const notes = getFilteredNotes();

  if (notes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-8">
        <FileText size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-medium">No notes found</p>
        <p className="text-sm mt-1">Create a new note or change your search</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
      <div className="p-2 space-y-1">
        {notes.map((note) => (
          <button
            key={note.id}
            type="button"
            onClick={() => setActiveNote(note.id)}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              activeNoteId === note.id
                ? 'bg-primary-50 dark:bg-primary-900/30 border-l-2 border-primary-500'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-start gap-2">
              <FileText
                size={16}
                className={`mt-0.5 flex-shrink-0 ${
                  activeNoteId === note.id
                    ? 'text-primary-500'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {note.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {note.content.replace(/^#\s+.+\n/, '').slice(0, 100)}...
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    <Clock size={12} />
                    {formatDistanceToNow(note.updatedAt)}
                  </span>
                  {note.tags.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <Tag size={12} />
                      {note.tags[0]}
                      {note.tags.length > 1 && `+${note.tags.length - 1}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
