import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { InlineLoginForm, InlineRegisterForm, InlineForgotPasswordForm } from './InlineAuthForms';

export default function LandingPage() {
  const [view, setView] = useState<'login' | 'register' | 'forgot-password'>('login');
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return null;
  }

  const getTitle = () => {
    switch (view) {
      case 'login':
        return '登录 NoteFlow';
      case 'register':
        return '注册 NoteFlow';
      case 'forgot-password':
        return '找回密码';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        {/* Left side - Branding */}
        <div className="flex-1 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              NoteFlow
            </h1>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            云端笔记
            <br />
            <span className="text-primary-600">随时随地记录</span>
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto lg:mx-0">
            优雅的 Markdown 编辑器，支持实时预览、文件夹管理，数据安全同步到云端。
          </p>

          <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>实时预览</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>云端同步</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>暗色主题</span>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {getTitle()}
            </h3>
            {view === 'login' && (
              <InlineLoginForm
                onSwitchToRegister={() => setView('register')}
                onSwitchToForgotPassword={() => setView('forgot-password')}
              />
            )}
            {view === 'register' && (
              <InlineRegisterForm onSwitchToLogin={() => setView('login')} />
            )}
            {view === 'forgot-password' && (
              <InlineForgotPasswordForm onSwitchToLogin={() => setView('login')} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
