import React from 'react';
import { Camera, Sparkles, Mic } from 'lucide-react';

interface HeaderProps {
  onStartVoice: () => void;
  isVoiceActive: boolean;
  onLogoClick?: () => void; // New: optional handler for "Start Over"
}

export const Header: React.FC<HeaderProps> = ({
  onStartVoice,
  isVoiceActive,
  onLogoClick,
}) => {
  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo area – now clickable to Start Over */}
        <button
          type="button"
          onClick={handleLogoClick}
          className="flex items-center gap-2 group focus:outline-none"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white group-hover:bg-indigo-400 transition-colors">
            <Camera className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white group-hover:text-indigo-200 transition-colors">
            Verasanti
          </span>
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={onStartVoice}
            className={`
              flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all
              ${
                isVoiceActive
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950'
                  : 'bg-slate-900 text-indigo-400 hover:bg-slate-800 ring-1 ring-inset ring-indigo-400/20'
              }
            `}
          >
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">Voice Mode</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-400/20">
            <Sparkles className="h-3 w-3" />
            <span>AI Headshots</span>
          </div>
        </div>
      </div>
    </header>
  );
};
