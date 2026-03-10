import { useState } from 'react';
import { Smartphone, Monitor, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import { useMobileUIStore } from '../../stores/mobileUIStore';

/**
 * Developer tool for switching between mobile and desktop views
 * Only visible in development mode
 */
export default function DevViewToggle() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { forceMode, setForceMode } = useMobileUIStore();

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  const modes: Array<{ value: 'auto' | 'mobile' | 'desktop'; label: string; icon: React.ReactNode }> = [
    { value: 'auto', label: 'Auto', icon: <RefreshCw className="w-4 h-4" /> },
    { value: 'mobile', label: 'Mobile', icon: <Smartphone className="w-4 h-4" /> },
    { value: 'desktop', label: 'Desktop', icon: <Monitor className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      {/* Collapsed state - just show current mode */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg shadow-lg hover:bg-gray-700 transition-colors text-sm"
          title="Dev: Switch view mode"
        >
          {forceMode === 'mobile' ? (
            <Smartphone className="w-4 h-4 text-yellow-400" />
          ) : forceMode === 'desktop' ? (
            <Monitor className="w-4 h-4 text-blue-400" />
          ) : (
            <RefreshCw className="w-4 h-4 text-green-400" />
          )}
          <span className="font-medium">{forceMode === 'auto' ? 'Auto' : forceMode}</span>
          <ChevronUp className="w-3 h-3 opacity-60" />
        </button>
      ) : (
        /* Expanded state - show all options */
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden min-w-[140px]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
            <span className="text-xs text-gray-400 font-medium">DEV: View Mode</span>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
          </div>
          <div className="p-1">
            {modes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => {
                  setForceMode(mode.value);
                  setIsExpanded(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm ${
                  forceMode === mode.value
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                {mode.icon}
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
