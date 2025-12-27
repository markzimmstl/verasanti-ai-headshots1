import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export const ProcessingStep: React.FC = () => {
  const [textIndex, setTextIndex] = useState(0);
  
  const loadingTexts = [
    "Analyzing facial structure...",
    "Building 3D profile...",
    "Setting up the virtual studio...",
    "Adjusting lighting...",
    "Rendering high-resolution textures...",
    "Polishing final details..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex(prev => (prev + 1) % loadingTexts.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-3xl animate-pulse"></div>
        <Loader2 className="relative h-20 w-20 text-indigo-500 animate-spin" />
      </div>
      
      <h2 className="text-3xl font-bold text-white mb-4">Building Your Brand Images</h2>
      
      <div className="h-8 overflow-hidden">
        <p key={textIndex} className="text-slate-400 text-lg animate-slide-up">
          {loadingTexts[textIndex]}
        </p>
      </div>

      <div className="mt-8 w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 w-full animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
      </div>
    </div>
  );
};