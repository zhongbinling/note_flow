import { MainLayout } from './components/Layout';
import { MarkdownEditor, Outline } from './components/Editor';
import NoteList from './components/NoteList';
import Resizable from './components/common/Resizable';

function App() {
  return (
    <MainLayout>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Note List Panel */}
        <Resizable
          defaultWidth={288}
          minWidth={180}
          maxWidth={400}
          direction="right"
          className="bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col min-h-0"
        >
          <NoteList />
        </Resizable>

        {/* Editor Panel */}
        <MarkdownEditor />

        {/* Outline Panel */}
        <Resizable
          defaultWidth={224}
          minWidth={150}
          maxWidth={350}
          direction="left"
          className="bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col min-h-0"
        >
          <Outline />
        </Resizable>
      </div>
    </MainLayout>
  );
}

export default App;
