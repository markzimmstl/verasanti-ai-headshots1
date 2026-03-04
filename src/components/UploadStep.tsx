import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, AlertCircle, Check, Camera, Sun, Maximize2, ArrowUpDown, Loader2, RefreshCw, Sparkles, ChevronDown } from 'lucide-react';
import { ReferenceImage, MultiReferenceSet } from '../types.ts';
import { Button } from './Button.tsx';
import { generateConfirmationPhoto, overlayLogoOnConfirmationPhoto, checkPhotoQuality, PhotoQualityResult } from '../services/geminiService.ts';

interface UploadStepProps {
  referenceImages: MultiReferenceSet;
  onUpdate: (images: MultiReferenceSet) => void;
  onNext: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const UploadStep: React.FC<UploadStepProps> = ({
  referenceImages,
  onUpdate,
  onNext,
}) => {
  const [error, setError]                             = useState<string | null>(null);
  const [confirmationPhoto, setConfirmationPhoto]     = useState<string | null>(null);
  const [isGeneratingConfirmation, setIsGeneratingConfirmation] = useState(false);
  const [confirmationError, setConfirmationError]     = useState<string | null>(null);
  const [qualityWarnings, setQualityWarnings]         = useState<string[]>([]);
  const confirmationRef = useRef<HTMLDivElement>(null);

  // Auto-trigger confirmation photo when main photo is uploaded
  useEffect(() => {
    if (referenceImages.main && !confirmationPhoto && !isGeneratingConfirmation) {
      handleGenerateConfirmation();
    }
  }, [referenceImages.main]);

  const handleGenerateConfirmation = async () => {
    if (!referenceImages.main) return;
    setIsGeneratingConfirmation(true);
    setConfirmationError(null);
    setConfirmationPhoto(null);
    try {
      const rawPhoto    = await generateConfirmationPhoto(referenceImages);
      const composited  = await overlayLogoOnConfirmationPhoto(rawPhoto, '/VeraLooks_logo_white.png');
      setConfirmationPhoto(composited);
    } catch (err: any) {
      console.error('Confirmation photo failed:', err);
      setConfirmationError('Preview generation failed. You can still continue.');
    } finally {
      setIsGeneratingConfirmation(false);
    }
  };

  const scrollToConfirmation = () => {
    confirmationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const processFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (file: File, role: keyof MultiReferenceSet) => {
    setError(null);
    if (file.size > MAX_FILE_SIZE) { setError('File is too large. Max 10MB.'); return; }
    try {
      const base64   = await processFile(file);
      const newImage: ReferenceImage = {
        id: Date.now().toString(),
        fileName: file.name,
        base64,
        createdAt: Date.now(),
        role: role as any,
      };
      onUpdate({ ...referenceImages, [role]: newImage });
      if (role === 'main') {
        setQualityWarnings([]);
        const quality = await checkPhotoQuality(base64);
        if (!quality.passed) setQualityWarnings(quality.warnings);
      }
    } catch {
      setError('Failed to process image. Please try again.');
    }
  };

  const removeImage = (role: keyof MultiReferenceSet) => {
    const newSet = { ...referenceImages };
    delete newSet[role];
    onUpdate(newSet);
    if (role === 'main') {
      setConfirmationPhoto(null);
      setConfirmationError(null);
    }
  };

  // ── Upload Slot ────────────────────────────────────────────────
  const UploadSlot = ({
    role, label, subLabel,
  }: {
    role: keyof MultiReferenceSet;
    label: string;
    subLabel?: string;
  }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const image    = referenceImages[role];

    const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
    const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
    const onDrop      = (e: React.DragEvent) => {
      e.preventDefault(); setIsDragOver(false);
      if (e.dataTransfer.files?.length) handleFileSelect(e.dataTransfer.files[0], role);
    };
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) handleFileSelect(e.target.files[0], role);
    };

    return (
      <div className="flex flex-col gap-2">
        {/* Label */}
        <label className="flex flex-col" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500 }}>
          {label}
          {subLabel && (
            <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              {subLabel}
            </span>
          )}
        </label>

        {image ? (
          /* ── Filled ── */
          <div
            className="relative group aspect-[3/4] w-full overflow-hidden rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(13,148,136,0.35)' }}
          >
            <img
              src={image.base64} alt={label}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <button
              onClick={e => { e.stopPropagation(); removeImage(role); }}
              className="absolute top-2.5 right-2.5 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
            <div
              className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium"
              style={{
                background: 'rgba(13,148,136,0.2)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(13,148,136,0.4)',
                color: '#0D9488',
              }}
            >
              <Check className="w-3 h-3" /> Added
            </div>
          </div>
        ) : (
          /* ── Empty ── */
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className="aspect-[3/4] w-full rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all"
            style={{
              border: `2px dashed ${isDragOver ? 'rgba(76,29,149,0.7)' : 'rgba(255,255,255,0.1)'}`,
              background: isDragOver ? 'rgba(76,29,149,0.08)' : 'rgba(255,255,255,0.02)',
            }}
            onMouseOver={e => {
              if (!isDragOver) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)';
            }}
            onMouseOut={e => {
              if (!isDragOver) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          >
            <input
              type="file" ref={inputRef} onChange={onChange}
              className="hidden" accept="image/jpeg, image/png, image/webp"
            />
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
              style={{ background: 'rgba(76,29,149,0.15)', border: '1px solid rgba(76,29,149,0.25)' }}
            >
              <Upload className="w-4 h-4" style={{ color: '#9F67FF' }} />
            </div>
            <p className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {isDragOver ? 'Drop here' : 'Click or drag photo'}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-6 animate-fade-in">

      {/* ── Page header ── */}
      <div className="mb-10">
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-4 text-[11px] font-medium uppercase tracking-wider"
          style={{ background: 'rgba(76,29,149,0.12)', border: '1px solid rgba(76,29,149,0.25)', color: '#B98FFF' }}
        >
          Step 1 of 4
        </div>
        <h1
          className="mb-3 leading-tight"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 40,
            fontWeight: 400,
            color: '#fff',
            letterSpacing: '-0.02em',
          }}
        >
          Upload your reference photos
        </h1>
        <p className="text-[15px] font-light leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)', maxWidth: 520 }}>
          The AI learns what you look like from these photos. One clear face photo is enough —
          side angles and full body improve results.
        </p>
      </div>

      {/* ── Photo Tips ── */}
      <div
        className="mb-8 rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: '#fff' }}>
          <Camera className="w-4 h-4" style={{ color: '#9F67FF' }} />
          Quick Tips for Best Results
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* Critical tip */}
          <div
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <span
              className="mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <ArrowUpDown className="w-3 h-3 text-red-400" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="text-[12px] font-semibold text-red-300">CRITICAL: Keep the camera straight up and down</p>
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(239,68,68,0.15)', color: 'rgba(239,68,68,0.85)' }}
                >Critical</span>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
                A tilted or angled camera causes distortion the AI can't correct.
              </p>
            </div>
          </div>

          {/* Standard tips */}
          {[
            { icon: <Maximize2 className="w-3 h-3" style={{ color: '#9F67FF' }} />, iconBg: 'rgba(76,29,149,0.2)', iconBorder: 'rgba(76,29,149,0.35)',
              title: 'Face photos: fill about half the frame',
              body: 'Your face should be the clear subject — not too distant, not too cropped.' },
            { icon: <Upload className="w-3 h-3" style={{ color: '#0D9488' }} />, iconBg: 'rgba(13,148,136,0.15)', iconBorder: 'rgba(13,148,136,0.3)',
              title: 'Full-body: lower the camera to belly or chest height',
              body: 'Keep the camera upright — just lower it so your whole body fits in frame.' },
            { icon: <Sun className="w-3 h-3" style={{ color: '#F59E0B' }} />, iconBg: 'rgba(245,158,11,0.15)', iconBorder: 'rgba(245,158,11,0.3)',
              title: 'Light should shine onto the front of the subject',
              body: 'Avoid backlighting. Even, natural light on your face works best.' },
          ].map((tip, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <span
                className="mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: tip.iconBg, border: `1px solid ${tip.iconBorder}` }}
              >
                {tip.icon}
              </span>
              <div>
                <p className="text-[12px] font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>{tip.title}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>{tip.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div
          className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl text-[13px]"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'rgba(239,68,68,0.85)' }}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Quality warnings ── */}
      {qualityWarnings.length > 0 && (
        <div
          className="mb-6 px-4 py-3 rounded-xl space-y-1.5"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" style={{ color: '#F59E0B' }} />
            <p className="text-[12px] font-semibold" style={{ color: '#F59E0B' }}>Photo Quality Notice</p>
          </div>
          {qualityWarnings.map((w, i) => (
            <p key={i} className="text-[12px] ml-6" style={{ color: 'rgba(245,158,11,0.75)' }}>{w}</p>
          ))}
          <p className="text-[11px] ml-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
            You can still continue — but better quality photos produce better results.
          </p>
        </div>
      )}

      {/* ── Upload grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        {/* Main photo — spans 2 cols/rows */}
        <div className="sm:col-span-2 sm:row-span-2 relative">
          <UploadSlot
            role="main"
            label="Main Photo (Required)"
            subLabel="Face the camera, good lighting, no heavy filters."
          />
          {!referenceImages.main && (
            <div className="absolute -bottom-8 left-0 right-0 text-center">
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(76,29,149,0.12)', border: '1px solid rgba(76,29,149,0.25)', color: '#B98FFF' }}
              >
                Required
              </span>
            </div>
          )}
        </div>

        <UploadSlot role="fullBody"  label="Full-Body Photo" subLabel="Optional — head to toe, camera at chest height, upright." />

        {/* Preview alert + Next button — desktop only */}
        <div className="hidden md:flex flex-col justify-end gap-2">
          {referenceImages.main && (
            <button
              onClick={scrollToConfirmation}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left group transition-all"
              style={{ border: '1px solid rgba(76,29,149,0.4)', background: 'rgba(76,29,149,0.1)' }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(76,29,149,0.16)')}
              onMouseOut={e => (e.currentTarget.style.background = 'rgba(76,29,149,0.1)')}
            >
              <div className="flex items-center gap-2">
                {isGeneratingConfirmation ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" style={{ color: '#9F67FF' }} />
                ) : confirmationPhoto ? (
                  <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: '#9F67FF' }} />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
                )}
                <span className="text-[12px] leading-snug" style={{ color: 'rgba(159,103,255,0.85)' }}>
                  {isGeneratingConfirmation
                    ? 'Generating your AI preview below…'
                    : confirmationPhoto
                    ? 'AI preview ready — scroll down to see it.'
                    : confirmationError
                    ? 'Preview failed — scroll down to retry.'
                    : 'Preparing your AI preview…'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 shrink-0 group-hover:translate-y-0.5 transition-transform" style={{ color: '#9F67FF' }} />
            </button>
          )}
          <button
            onClick={onNext}
            disabled={!referenceImages.main}
            className="w-full py-3 rounded-xl text-[13px] font-semibold transition-all"
            style={{
              background:  referenceImages.main ? 'linear-gradient(135deg, #2E1065, #4C1D95)' : 'rgba(255,255,255,0.04)',
              color:       referenceImages.main ? '#fff' : 'rgba(255,255,255,0.2)',
              border:      referenceImages.main ? 'none' : '1px solid rgba(255,255,255,0.06)',
              cursor:      referenceImages.main ? 'pointer' : 'not-allowed',
              boxShadow:   referenceImages.main ? '0 8px 24px rgba(46,16,101,0.4)' : 'none',
            }}
          >
            Next: Design Photoshoot
          </button>
        </div>

        <UploadSlot role="sideLeft"  label="Your Left Side"  subLabel="Optional — turn so your left faces the camera." />
        <UploadSlot role="sideRight" label="Your Right Side" subLabel="Optional — turn so your right faces the camera." />
      </div>

      {/* ── AI Confirmation Preview ── */}
      {referenceImages.main && (
        <div
          ref={confirmationRef}
          className="mb-8 rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
          >
            <div>
              <h3 className="text-sm font-semibold text-white">AI Confirmation Preview</h3>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                A quick preview of how the AI reads your photo — before you design your full shoot.
              </p>
            </div>
            {!isGeneratingConfirmation && (
              <button
                onClick={handleGenerateConfirmation}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)'; }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                <RefreshCw className="w-3 h-3" /> Regenerate
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex flex-col md:flex-row gap-6 p-5">
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>Your Photo</p>
              <div className="rounded-xl overflow-hidden aspect-square w-full" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <img src={referenceImages.main.base64} alt="Your uploaded photo" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>AI Preview</p>
              <div
                className="rounded-xl overflow-hidden aspect-square w-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {isGeneratingConfirmation && (
                  <div className="flex flex-col items-center gap-3 text-center px-4">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#9F67FF' }} />
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Generating your preview…</p>
                  </div>
                )}
                {confirmationPhoto && !isGeneratingConfirmation && (
                  <img src={confirmationPhoto} alt="AI confirmation preview" className="w-full h-full object-cover" />
                )}
                {confirmationError && !isGeneratingConfirmation && (
                  <div className="flex flex-col items-center gap-2 text-center px-4">
                    <AlertCircle className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.2)' }} />
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{confirmationError}</p>
                    <button
                      onClick={handleGenerateConfirmation}
                      className="text-xs underline mt-1 transition-colors"
                      style={{ color: '#9F67FF' }}
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-5 pb-4">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              This preview uses a standard VeraLooks studio setup. Your actual generated photos will reflect the
              style, clothing, and scene you choose on the next screen.
            </p>
          </div>
        </div>
      )}

      {/* ── Mobile action bar ── */}
      <div
        className="flex justify-end pt-6 border-t md:hidden"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={onNext}
          disabled={!referenceImages.main}
          className="px-8 py-3 rounded-xl text-[14px] font-semibold transition-all"
          style={{
            background: referenceImages.main ? 'linear-gradient(135deg, #2E1065, #4C1D95)' : 'rgba(255,255,255,0.04)',
            color:      referenceImages.main ? '#fff' : 'rgba(255,255,255,0.25)',
            cursor:     referenceImages.main ? 'pointer' : 'not-allowed',
          }}
        >
          Next: Design Photoshoot
        </button>
      </div>

    </div>
  );
};
