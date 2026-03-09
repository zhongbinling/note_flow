import { useEffect, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Resizable from '../common/Resizable';
import { useAuthStore } from '../../stores/authStore';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    // Check authentication status on app load
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <Resizable
        defaultWidth={256}
        minWidth={180}
        maxWidth={350}
        direction="right"
        className="h-full"
      >
        <Sidebar />
      </Resizable>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <Header />
        <main className="flex-1 flex min-h-0 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
