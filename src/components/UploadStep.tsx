import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, Check, Info, Camera, Sun, Maximize2, ArrowUpDown } from 'lucide-react';
import { ReferenceImage, MultiReferenceSet } from '../types.ts';
import { Button } from './Button.tsx';

interface UploadStepProps {
  referenceImages: MultiReferenceSet;
  onUpdate: (images: MultiReferenceSet) => void;
  onNext: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const UploadStep: React.FC<UploadStepProps> = ({ 
  referenceImages, 
  onUpdate, 
  onNext 
}) => {
  const [error, setError] = useState<string | null>(null);

  const processFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (file: File, role: keyof MultiReferenceSet) => {
    setError(null);
    
    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large. Max 10MB.');
      return;
    }

    try {
      const base64 = await processFile(file);
      const newImage: ReferenceImage = {
        id: Date.now().toString(),
        fileName: file.name,
        base64,
        createdAt: Date.now(),
        role: role as any,
      };

      onUpdate({
        ...referenceImages,
        [role]: newImage
      });
    } catch (err) {
      setError('Failed to process image. Please try again.');
    }
  };

  const removeImage = (role: keyof MultiReferenceSet) => {
    const newSet = { ...referenceImages };
    delete newSet[role];
    onUpdate(newSet);
  };

  const UploadSlot = ({ role, label, subLabel }: { role: keyof MultiReferenceSet, label: string, subLabel?: string }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const image = referenceImages[role];

    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
    const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
    const onDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      if (files && files.length > 0) handleFileSelect(files[0], role);
    };
    const onClick = () => inputRef.current?.click();
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) handleFileSelect(e.target.files[0], role);
    };

    return (
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-300 flex flex-col">
          {label}
          {subLabel && <span className="text-xs text-slate-500 font-normal">{subLabel}</span>}
        </label>
        
        {image ? (
          <div className="relative group aspect-[3/4] w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
            <img 
              src={image.base64} 
              alt={label} 
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
            />
            <button
              onClick={(e) => { e.stopPropagation(); removeImage(role); }}
              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500/80 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 right-2 bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-md backdrop-blur-sm border border-green-500/30 flex items-center gap-1">
              <Check className="w-3 h-3" /> Ready
            </div>
          </div>
        ) : (
          <div
            onClick={onClick}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`aspect-[3/4] w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 cursor-pointer transition-all ${
              isDragOver 
                ? 'border-indigo-500 bg-indigo-500/10' 
                : 'border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-900'
            }`}
          >
            <input 
              type="file" 
              ref={inputRef}
              onChange={onChange} 
              className="hidden" 
              accept="image/jpeg, image/png, image/webp"
            />
            <div className="p-3 bg-slate-800 rounded-full mb-3 text-slate-400">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-400 text-center">
              {isDragOver ? 'Drop here' : 'Click or Drag Photo'}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">Upload Reference Photos</h2>
        <p className="text-slate-400 max-w-lg mx-auto text-sm">
          The AI needs to learn what the subject looks like. <br />
          <span className="text-indigo-400">One good photo is enough</span>, but adding side angles helps improve likeness.
        </p>
      </div>

      {/* Photo Tips */}
      <div className="mb-8 bg-slate-900/70 border border-slate-700 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Camera className="w-4 h-4 text-indigo-400" />
          Quick Tips for Best Results
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
              <ArrowUpDown className="w-3 h-3 text-red-400" />
            </span>
            <div>
              <p className="text-xs font-semibold text-red-300">CRITICAL: Keep the camera straight up and down</p>
              <p className="text-xs text-slate-400 mt-0.5">A tilted or angled camera causes distortion the AI can't correct.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <Maximize2 className="w-3 h-3 text-indigo-400" />
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-200">Face photos: fill about half the frame</p>
              <p className="text-xs text-slate-400 mt-0.5">Your face should be the clear subject — not too distant, not too cropped.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <Upload className="w-3 h-3 text-indigo-400" />
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-200">Full-body: lower the camera to belly or chest height</p>
              <p className="text-xs text-slate-400 mt-0.5">Keep the camera upright — just lower it so your whole body fits in frame.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <Sun className="w-3 h-3 text-indigo-400" />
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-200">Light should shine onto the front of the subject</p>
              <p className="text-xs text-slate-400 mt-0.5">Avoid backlighting. Even, natural light on your face works best — not too dark, not too bright.</p>
            </div>
          </div>

        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-200 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Upload Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">

        {/* Main Photo — large, spans 2 cols */}
        <div className="sm:col-span-2 sm:row-span-2 relative">
          <UploadSlot 
            role="main" 
            label="Main Photo (Required)"
            subLabel="Face the camera, good lighting, no heavy filters."
          />
          {!referenceImages.main && (
            <div className="absolute -bottom-8 left-0 right-0 text-center">
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full border border-indigo-500/20">
                <Info className="w-3 h-3" /> Required
              </span>
            </div>
          )}
        </div>

        {/* Full Body — moved up to second most prominent */}
        <UploadSlot 
          role="fullBody" 
          label="Full-Body Photo" 
          subLabel="Optional — head to toe, camera at chest height, upright." 
        />

        {/* Spacer slot to fill the 2×2 grid on the right */}
        <div className="hidden md:block" />

        {/* Side views — Your Left and Your Right */}
        <UploadSlot 
          role="sideLeft" 
          label="Your Left Side" 
          subLabel="Optional — turn so your left faces the camera." 
        />
        <UploadSlot 
          role="sideRight" 
          label="Your Right Side" 
          subLabel="Optional — turn so your right faces the camera." 
        />

      </div>

      {/* Action Bar */}
      <div className="flex justify-end pt-6 border-t border-slate-800">
        <Button 
          onClick={onNext}
          disabled={!referenceImages.main}
          className="px-8"
        >
          Next: Design Photoshoot
        </Button>
      </div>
    </div>
  );
};
