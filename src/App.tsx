import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/Layout';
import { MarkdownEditor, Outline } from './components/Editor';
import NoteList from './components/NoteList';
import Resizable from './components/common/Resizable';
import LandingPage from './components/Auth/LandingPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { useAuthStore } from './stores/authStore';

function MainApp() {
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

function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <>{children}</>;
}

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/*"
        element={
          <AuthenticatedRoute>
            <MainApp />
          </AuthenticatedRoute>
        }
      />
    </Routes>
  );
}

export default App;
