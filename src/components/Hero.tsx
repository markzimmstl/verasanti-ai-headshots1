import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface HeroProps {
  onStart: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStart }) => {
  return (
    <div className="flex-1 flex flex-col justify-center items-center text-center px-4 py-20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(120,119,198,0.1),transparent_50%)] -z-10"></div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8 animate-fade-in">
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
        Now using Gemini 2.5 Flash Image
      </div>

      <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 max-w-4xl leading-tight">
        Professional Headshots<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
          Reimagined by AI
        </span>
      </h1>

      <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
        Upload a casual selfie and instantly generate studio-quality professional photos. No photographer required.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mb-16">
        <button 
          onClick={onStart}
          className="group relative px-8 py-4 bg-white text-slate-950 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
        >
          Try Verasanti Free
          <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl w-full">
        {[
          { title: 'Studio Quality', desc: '4K resolution with professional lighting and depth of field.' },
          { title: 'Lightning Fast', desc: 'Get your photos in seconds using the latest Gemini models.' },
          { title: 'Style Control', desc: 'Choose from Corporate, Startup, or Creative aesthetics.' }
        ].map((item, i) => (
          <div key={i} className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
            <p className="text-slate-400">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Hero;