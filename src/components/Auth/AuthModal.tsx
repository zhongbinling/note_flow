import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, defaultView = 'login' }: AuthModalProps) {
  const [view, setView] = useState<'login' | 'register'>(defaultView);

  if (!isOpen) return null;

  if (view === 'login') {
    return (
      <LoginForm
        onClose={onClose}
        onSwitchToRegister={() => setView('register')}
      />
    );
  }

  return (
    <RegisterForm
      onClose={onClose}
      onSwitchToLogin={() => setView('login')}
    />
  );
}
