import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  RefreshCw, 
  Wand2, 
  ArrowRight, 
  Edit2, 
  X, 
  Plus, 
  Sparkles, 
  Zap, 
  Eye, 
  ChevronDown,
  Printer,
  Globe,
} from 'lucide-react';
import { GeneratedImage, AspectRatio } from '../types.ts';
import { Button } from './Button.tsx';
import { refineGeneratedImage } from '../services/geminiService.ts';

interface ResultsStepProps {
  results: GeneratedImage[];
  credits: number;
  onReset: () => void;
  onUpdateImage: (id: string, newUrl: string) => void;
  onSpendCredit: (amount: number) => void;
  onAddCredits: () => void;
  onGenerateMore: () => void;
}

const QUICK_EDITS = [
  "Remove background screen",
  "Fix eyes", 
  "Make smile natural",
  "Soften skin texture",
  "Blur background"
];

export const ResultsStep: React.FC<ResultsStepProps> = ({ 
  results, 
  credits, 
  onReset, 
  onUpdateImage, 
  onSpendCredit,
  onAddCredits,
  onGenerateMore
}) => {
  const [editingImage, setEditingImage] = useState<GeneratedImage | null>(null);
  const [viewingImage, setViewingImage] = useState<GeneratedImage | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [openDownloadMenuId, setOpenDownloadMenuId] = useState<string | null>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setOpenDownloadMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- IMPROVED DOWNLOAD LOGIC (Force "Save As") ---

  const downloadFile = async (blob: Blob, filename: string) => {
    // 1. Try the Modern "Save As" API (Chrome/Edge/Opera)
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'Image',
            accept: { [blob.type]: ['.' + filename.split('.').pop()] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return; // Success, exit function
      } catch (err: any) {
        // If user cancels the dialog, just stop
        if (err.name === 'AbortError') return;
        // If technical error, fall through to legacy method below
        console.warn('File System Access API failed, falling back:', err);
      }
    }

    // 2. Legacy Fallback (Firefox/Safari)
    // This creates a link and clicks it. Browser settings determine if "Save As" opens.
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const convertToJpg = (blob: Blob): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((jpgBlob) => {
            resolve(jpgBlob);
            URL.revokeObjectURL(url);
          }, 'image/jpeg', 0.85); 
        } else {
          resolve(null);
          URL.revokeObjectURL(url);
        }
      };
      
      img.onerror = () => {
        resolve(null);
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    });
  };

  const handleDownload = async (imageUrl: string, id: string, format: 'png' | 'jpg') => {
    setOpenDownloadMenuId(null); 
    try {
      const response = await fetch(imageUrl);
      const originalBlob = await response.blob();

      if (format === 'png') {
        await downloadFile(originalBlob, `verasanti-print-${id.slice(-6)}.png`);
      } else {
        const jpgBlob = await convertToJpg(originalBlob);
        if (jpgBlob) {
          await downloadFile(jpgBlob, `verasanti-web-${id.slice(-6)}.jpg`);
        } else {
          throw new Error("JPG Conversion failed");
        }
      }
    } catch (error) {
      console.error('Download failed:', error);
      window.open(imageUrl, '_blank');
    }
  };

  const handleDownloadAll = async () => {
    for (const img of results) {
      await handleDownload(img.imageUrl, img.id, 'png');
      // Wait for user to interact with Save dialog before prompting next one
      await new Promise(r => setTimeout(r, 1000)); 
    }
  };

  // --- EDIT LOGIC ---

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingImage || !editPrompt) return;

    if (credits < 1) {
      alert("You need 1 credit to edit an image.");
      return;
    }

    setIsProcessing(true);
    try {
      onSpendCredit(1); 
      const newImageUrl = await refineGeneratedImage(
        editingImage.imageUrl, 
        editPrompt, 
        editingImage.aspectRatio
      );
      
      onUpdateImage(editingImage.id, newImageUrl);
      setEditingImage(null);
      setEditPrompt('');
    } catch (error) {
      console.error("Edit failed", error);
      alert("Something went wrong editing the image. Credits have been refunded.");
      onSpendCredit(-1); 
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickEditClick = (prompt: string) => {
    setEditPrompt(prompt);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Your Photos</h2>
          <p className="text-slate-400">High-fidelity renders ready for download.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleDownloadAll} className="hidden md:flex">
            <Download className="w-4 h-4 mr-2" />
            Download All
          </Button>
          <Button variant="outline" onClick={onGenerateMore}>
            <Plus className="w-4 h-4 mr-2" />
            Generate More
          </Button>
          <Button onClick={onReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Start Over
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((img) => (
          <div key={img.id} className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all hover:shadow-2xl hover:border-slate-700">
            {/* Image Container */}
            <div className={`relative w-full bg-slate-950 ${getAspectRatioClass(img.aspectRatio)}`}>
              <img 
                src={img.imageUrl} 
                alt={img.styleName}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Hover Actions (Center) */}
              <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={() => setViewingImage(img)}
                  className="bg-black/50 backdrop-blur-md text-white p-3 rounded-full hover:bg-indigo-600 transition-colors transform hover:scale-110"
                  title="View Larger"
                >
                  <Eye className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="p-4 flex items-center justify-between bg-slate-900 relative z-10 border-t border-slate-800">
              <div className="flex-1 min-w-0 mr-2">
                <p className="text-sm font-medium text-white truncate">{img.styleName}</p>
                <p className="text-xs text-slate-500">
                  {new Date(img.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {/* Edit Button */}
                <button 
                  onClick={() => setEditingImage(img)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Edit with AI"
                >
                  <Wand2 className="w-4 h-4" />
                </button>

                {/* Download Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setOpenDownloadMenuId(openDownloadMenuId === img.id ? null : img.id)}
                    className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${openDownloadMenuId === img.id ? 'bg-indigo-600 text-white' : 'text-indigo-400 hover:bg-indigo-500/10'}`}
                    title="Download Options"
                  >
                    <Download className="w-4 h-4" />
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {/* Dropdown Menu */}
                  {openDownloadMenuId === img.id && (
                    <div 
                      ref={downloadMenuRef}
                      className="absolute bottom-full right-0 mb-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in"
                    >
                      <div className="p-1">
                        <button
                          onClick={() => handleDownload(img.imageUrl, img.id, 'jpg')}
                          className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-left"
                        >
                          <Globe className="w-4 h-4 text-indigo-400" />
                          <div>
                            <span className="block font-medium">Online (JPG)</span>
                            <span className="block text-[10px] text-slate-500">Small file size</span>
                          </div>
                        </button>
                        <button
                          onClick={() => handleDownload(img.imageUrl, img.id, 'png')}
                          className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-left"
                        >
                          <Printer className="w-4 h-4 text-purple-400" />
                          <div>
                            <span className="block font-medium">Print (PNG)</span>
                            <span className="block text-[10px] text-slate-500">Highest quality</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* VIEW LARGE MODAL */}
      {viewingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in" onClick={() => setViewingImage(null)}>
          <button 
            onClick={() => setViewingImage(null)}
            className="absolute top-6 right-6 p-2 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={viewingImage.imageUrl} 
            alt="Full View" 
            className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl rounded-sm"
            onClick={(e) => e.stopPropagation()} 
          />
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4" onClick={(e) => e.stopPropagation()}>
             <Button onClick={() => handleDownload(viewingImage.imageUrl, viewingImage.id, 'jpg')}>
                <Download className="w-4 h-4 mr-2" /> Download JPG
             </Button>
             <Button variant="outline" onClick={() => handleDownload(viewingImage.imageUrl, viewingImage.id, 'png')}>
                <Download className="w-4 h-4 mr-2" /> Download PNG
             </Button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-fade-in">
          {/* Main Card Container */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl">
            
            {/* Left: Image Preview (Mobile: Fixed height | Desktop: Full height) */}
            <div className="w-full h-64 md:h-auto md:w-1/2 bg-black flex items-center justify-center p-4 relative shrink-0">
               <img 
                 src={editingImage.imageUrl} 
                 alt="Editing" 
                 className="h-full w-full object-contain rounded-lg"
               />
               {isProcessing && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white">
                   <div className="relative mb-4">
                     <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full"></div>
                     <RefreshCw className="w-12 h-12 animate-spin text-indigo-500 relative z-10" />
                   </div>
                   <p className="text-lg font-bold">Refining Image...</p>
                   <p className="text-sm text-slate-400">Applying your changes</p>
                 </div>
               )}
            </div>

            {/* Right: Controls (Scrollable) */}
            <div className="w-full md:w-1/2 p-6 flex flex-col overflow-y-auto">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-indigo-400" />
                  Magic Editor
                </h3>
                <button 
                  onClick={() => setEditingImage(null)}
                  className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Instructions</label>
                  <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Describe what to change (e.g. 'Remove the glasses', 'Make background blurry', 'Fix the eyes')..."
                    className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    autoFocus
                  />
                </div>

                {/* QUICK ACTIONS */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Quick Fixes</label>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_EDITS.map((edit) => (
                      <button
                        key={edit}
                        type="button"
                        onClick={() => handleQuickEditClick(edit)}
                        className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
                      >
                        {edit === "Remove background screen" && <Zap className="w-3 h-3 text-yellow-400" />}
                        {edit}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-lg p-4 flex gap-3 shrink-0">
                  <div className="p-2 bg-indigo-500/20 rounded-lg h-fit">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-indigo-200">Generative Fill</p>
                    <p className="text-xs text-indigo-300/70 mt-1">
                      The AI will regenerate parts of the image based on your text. This costs <strong>1 Credit</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 shrink-0 pt-4 bg-slate-900 sticky bottom-0 border-t border-slate-800 md:border-none md:static md:bg-transparent">
                <Button 
                  variant="outline" 
                  onClick={() => setEditingImage(null)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleEditSubmit}
                  disabled={!editPrompt.trim() || isProcessing}
                  className="bg-indigo-600 hover:bg-indigo-500"
                >
                  {isProcessing ? 'Processing...' : 'Apply Changes'}
                  {!isProcessing && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper for Aspect Ratios CSS
const getAspectRatioClass = (ratio: AspectRatio): string => {
  switch (ratio) {
    case '1:1': return 'aspect-square';
    case '16:9': return 'aspect-video';
    case '9:16': return 'aspect-[9/16]';
    case '4:5': return 'aspect-[4/5]';
    case '3:1': return 'aspect-[3/1]';
    case '4:1': return 'aspect-[4/1]';
    default: return 'aspect-square';
  }
};